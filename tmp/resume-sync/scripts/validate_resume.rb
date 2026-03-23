#!/usr/bin/env ruby
# frozen_string_literal: true

require "date"
require "pathname"
require "yaml"

ROOT = Pathname.new(File.expand_path("..", __dir__))
RESUME_PATH = ROOT.join("resume.yaml")
ALLOWED_LINK_KINDS = %w[contact docs live other repo].freeze
ALLOWED_SECTION_LAYOUTS = %w[chips compact list].freeze

def assert(condition, errors, message)
  errors << message unless condition
end

def iso_date?(value)
  return false unless value.is_a?(String)

  Date.iso8601(value)
  true
rescue ArgumentError
  false
end

def non_empty_string?(value)
  value.is_a?(String) && !value.strip.empty?
end

def localized_text?(value)
  value.is_a?(Hash) &&
    value.keys.all? { |key| %w[ko en].include?(key.to_s) } &&
    value.values.any? { |item| non_empty_string?(item) }
end

def text_value?(value)
  non_empty_string?(value) || localized_text?(value)
end

def validate_text_value(value, errors, label, required: true)
  if value.nil?
    assert(!required, errors, "#{label} is required")
    return
  end

  assert(text_value?(value), errors, "Invalid #{label} section")
end

def validate_markdown_reference(value, errors, label)
  case value
  when String
    assert(non_empty_string?(value), errors, "#{label} must be a non-empty string")
    if non_empty_string?(value)
      resolved = ROOT.join(value)
      assert(resolved.exist?, errors, "Missing markdown file: #{value}")
    end
  when Hash
    assert(value.keys.all? { |key| %w[ko en].include?(key.to_s) }, errors, "Invalid #{label} section")
    assert(value.values.any? { |item| non_empty_string?(item) }, errors, "#{label} must include at least one locale path")
    value.each do |locale, path|
      next unless non_empty_string?(path)

      resolved = ROOT.join(path)
      assert(resolved.exist?, errors, "Missing markdown file: #{path}")
    end
  else
    errors << "Invalid #{label} section"
  end
end

def validate_text_source(value, errors, label)
  if value.is_a?(Hash) && value.key?("markdown")
    validate_markdown_reference(value["markdown"], errors, "#{label}.markdown")
    return
  end

  validate_text_value(value, errors, label)
end

def validate_links(value, errors, label)
  assert(value.is_a?(Array), errors, "#{label} must be an array")
  return unless value.is_a?(Array)

  value.each_with_index do |item, index|
    item_label = "#{label}[#{index}]"
    assert(item.is_a?(Hash), errors, "Invalid #{item_label} shape")
    next unless item.is_a?(Hash)

    validate_text_value(item["label"], errors, "#{item_label}.label", required: false) if item.key?("label")
    assert(non_empty_string?(item["url"]), errors, "#{item_label}.url must be a non-empty string")
    if item.key?("kind")
      assert(ALLOWED_LINK_KINDS.include?(item["kind"]), errors, "#{item_label}.kind must be one of #{ALLOWED_LINK_KINDS.join(', ')}")
    end
  end
end

def validate_resume_item(item, errors, label)
  assert(item.is_a?(Hash), errors, "Invalid #{label} shape")
  return unless item.is_a?(Hash)

  validate_text_value(item["title"], errors, "#{label}.title")
  validate_text_value(item["subtitle"], errors, "#{label}.subtitle", required: false) if item.key?("subtitle")
  validate_text_value(item["location"], errors, "#{label}.location", required: false) if item.key?("location")
  validate_text_source(item["detailsMarkdown"], errors, "#{label}.detailsMarkdown") if item.key?("detailsMarkdown")
  validate_links(item["links"], errors, "#{label}.links") if item.key?("links")

  assert(iso_date?(item["start"]), errors, "#{label}.start must be YYYY-MM-DD") if item.key?("start") && !item["start"].nil?
  assert(iso_date?(item["end"]), errors, "#{label}.end must be YYYY-MM-DD") if item.key?("end") && !item["end"].nil?
  assert([true, false].include?(item["current"]), errors, "#{label}.current must be boolean") if item.key?("current")

  if item.key?("bullets")
    assert(item["bullets"].is_a?(Array), errors, "#{label}.bullets must be an array")
    if item["bullets"].is_a?(Array)
      item["bullets"].each_with_index do |bullet, index|
        assert(text_value?(bullet), errors, "#{label}.bullets[#{index}] must be a non-empty string or localized text")
      end
    end
  end
end

def validate_project(item, errors, label)
  validate_resume_item(item, errors, label)
  return unless item.is_a?(Hash)

  assert(non_empty_string?(item["id"]), errors, "#{label}.id must be a non-empty string") if item.key?("id")
  assert(non_empty_string?(item["repo"]), errors, "#{label}.repo must be a non-empty string") if item.key?("repo")
  assert(non_empty_string?(item["liveUrl"]), errors, "#{label}.liveUrl must be a non-empty string") if item.key?("liveUrl")

  if item.key?("tech")
    assert(item["tech"].is_a?(Array), errors, "#{label}.tech must be an array")
    if item["tech"].is_a?(Array)
      item["tech"].each_with_index do |tech, index|
        assert(text_value?(tech), errors, "#{label}.tech[#{index}] must be a non-empty string or localized text")
      end
    end
  end
end

def validate_education(item, errors, label)
  assert(item.is_a?(Hash), errors, "Invalid #{label} shape")
  return unless item.is_a?(Hash)

  if item.key?("school")
    validate_text_value(item["school"], errors, "#{label}.school")
    validate_text_value(item["degree"], errors, "#{label}.degree", required: false) if item.key?("degree")
    validate_text_value(item["status"], errors, "#{label}.status", required: false) if item.key?("status")
    assert(iso_date?(item["start"]), errors, "#{label}.start must be YYYY-MM-DD") if item.key?("start") && !item["start"].nil?
    assert(iso_date?(item["end"]), errors, "#{label}.end must be YYYY-MM-DD") if item.key?("end") && !item["end"].nil?
    return
  end

  validate_resume_item(item, errors, label)
end

def validate_custom_section_item(item, errors, label)
  assert(item.is_a?(Hash), errors, "Invalid #{label} shape")
  return unless item.is_a?(Hash)

  if item.key?("date") || item.key?("organization") || item.key?("note")
    validate_text_value(item["title"], errors, "#{label}.title")
    validate_text_value(item["organization"], errors, "#{label}.organization", required: false) if item.key?("organization")
    validate_text_value(item["note"], errors, "#{label}.note", required: false) if item.key?("note")
    assert(iso_date?(item["date"]), errors, "#{label}.date must be YYYY-MM-DD") if item.key?("date") && !item["date"].nil?
    return
  end

  validate_resume_item(item, errors, label)
end

errors = []

assert(RESUME_PATH.exist?, errors, "Missing resume.yaml")

if errors.empty?
  data = YAML.safe_load(RESUME_PATH.read, permitted_classes: [], aliases: false)

  required_top_level = %w[basics summary experience projects education skills customSections]
  required_top_level.each do |key|
    assert(data.key?(key), errors, "Missing top-level key: #{key}")
  end

  basics = data["basics"]
  assert(basics.is_a?(Hash), errors, "basics must be a hash")

  if basics.is_a?(Hash)
    validate_text_value(basics["name"], errors, "basics.name")
    validate_text_value(basics["headline"], errors, "basics.headline", required: false) if basics.key?("headline")
    validate_text_value(basics["location"], errors, "basics.location", required: false) if basics.key?("location")
    assert(non_empty_string?(basics["website"]), errors, "basics.website must be a non-empty string") if basics.key?("website")
    assert(non_empty_string?(basics["email"]), errors, "basics.email must be a non-empty string") if basics.key?("email")
    assert(non_empty_string?(basics["phone"]), errors, "basics.phone must be a non-empty string") if basics.key?("phone")

    if basics.key?("avatar")
      assert(non_empty_string?(basics["avatar"]), errors, "basics.avatar must be a non-empty string")
      if non_empty_string?(basics["avatar"])
        avatar_path = ROOT.join(basics["avatar"])
        assert(avatar_path.exist?, errors, "Missing avatar file: #{basics['avatar']}")
      end
    end

    if basics.key?("avatarUrl")
      assert(non_empty_string?(basics["avatarUrl"]), errors, "basics.avatarUrl must be a non-empty string")
    end

    if basics.key?("links")
      validate_links(basics["links"], errors, "basics.links")
    end
  end

  summary = data["summary"]
  assert(summary.is_a?(Hash), errors, "summary must be a hash")
  validate_text_source(summary["markdown"], errors, "summary.markdown") if summary.is_a?(Hash) && summary.key?("markdown")

  experience = data["experience"]
  assert(experience.is_a?(Array), errors, "experience must be an array")
  if experience.is_a?(Array)
    experience.each_with_index do |item, index|
      validate_resume_item(item, errors, "experience[#{index}]")
    end
  end

  projects = data["projects"]
  assert(projects.is_a?(Array), errors, "projects must be an array")
  if projects.is_a?(Array)
    projects.each_with_index do |item, index|
      validate_project(item, errors, "projects[#{index}]")
    end
  end

  if data.key?("featuredProjects")
    featured_projects = data["featuredProjects"]
    assert(featured_projects.is_a?(Array), errors, "featuredProjects must be an array")
    if featured_projects.is_a?(Array)
      featured_projects.each_with_index do |item, index|
        label = "featuredProjects[#{index}]"
        if item.is_a?(String)
          assert(non_empty_string?(item), errors, "#{label} must be a non-empty string")
        elsif item.is_a?(Hash)
          has_project = non_empty_string?(item["project"])
          has_repo = non_empty_string?(item["repo"])
          assert(has_project || has_repo, errors, "#{label} must include project or repo")
        else
          errors << "Invalid #{label} shape"
        end
      end
    end
  end

  education = data["education"]
  assert(education.is_a?(Array), errors, "education must be an array")
  if education.is_a?(Array)
    education.each_with_index do |item, index|
      validate_education(item, errors, "education[#{index}]")
    end
  end

  skills = data["skills"]
  assert(skills.is_a?(Array), errors, "skills must be an array")
  if skills.is_a?(Array)
    skills.each_with_index do |item, index|
      label = "skills[#{index}]"
      if item.is_a?(Hash)
        validate_text_value(item["title"], errors, "#{label}.title", required: false) if item.key?("title")
        assert(item["items"].is_a?(Array), errors, "#{label}.items must be an array")
        if item["items"].is_a?(Array)
          item["items"].each_with_index do |skill, skill_index|
            assert(text_value?(skill), errors, "#{label}.items[#{skill_index}] must be a non-empty string or localized text")
          end
        end
      else
        assert(text_value?(item), errors, "#{label} must be a non-empty string or localized text")
      end
    end
  end

  custom_sections = data["customSections"]
  assert(custom_sections.is_a?(Array), errors, "customSections must be an array")
  if custom_sections.is_a?(Array)
    custom_sections.each_with_index do |section, index|
      label = "customSections[#{index}]"
      assert(section.is_a?(Hash), errors, "Invalid #{label} shape")
      next unless section.is_a?(Hash)

      assert(non_empty_string?(section["id"]), errors, "#{label}.id must be a non-empty string") if section.key?("id")
      validate_text_value(section["title"], errors, "#{label}.title")
      if section.key?("layout")
        assert(ALLOWED_SECTION_LAYOUTS.include?(section["layout"]), errors, "#{label}.layout must be one of #{ALLOWED_SECTION_LAYOUTS.join(', ')}")
      end
      assert(section["items"].is_a?(Array), errors, "#{label}.items must be an array")
      next unless section["items"].is_a?(Array)

      section["items"].each_with_index do |item, item_index|
        validate_custom_section_item(item, errors, "#{label}.items[#{item_index}]")
      end
    end
  end
end

if errors.empty?
  puts "OK: resume.yaml structure validated."
else
  warn "Validation failed:"
  errors.each { |error| warn "- #{error}" }
  exit 1
end
