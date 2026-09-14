using DocumentFormat.OpenXml;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Validation;
using DocumentFormat.OpenXml.Wordprocessing;
using System.Text.Json;

if (args.Length == 0) {
    Console.Error.WriteLine("Pass exported .docx files or directories to validate.");
    return 2;
}
var files = args.SelectMany(path => Directory.Exists(path)
    ? Directory.GetFiles(path, "*.docx") : new[] { path }).Distinct().Order().ToArray();
if (files.Length == 0) {
    Console.Error.WriteLine("No DOCX files found. Run the browser export tests first.");
    return 2;
}
var failed = false;
foreach (var file in files) {
    try {
        // Read only. Opening with the Microsoft SDK also checks package part URIs
        // and relationships that permissive viewers or ZIP-only tests may miss.
        using var document = WordprocessingDocument.Open(file, false);
        var errors = new OpenXmlValidator(FileFormatVersions.Office2019) {
            MaxNumberOfErrors = 0,
        }.Validate(document).ToList();
        var embeddedFonts = document.MainDocumentPart?.FontTablePart?.FontParts.Count() ?? 0;
        var settings = document.MainDocumentPart?.DocumentSettingsPart?.Settings;
        var protectedDocument = (settings?.Elements<DocumentProtection>().Any() ?? false)
            || (settings?.Elements<WriteProtection>().Any() ?? false);
        var ok = errors.Count == 0 && embeddedFonts == 0 && !protectedDocument;
        Console.WriteLine(JsonSerializer.Serialize(new {
            file, ok, embeddedFonts, protectedDocument, errorCount = errors.Count,
            errors = errors.GroupBy(error => new { error.Description, Part = error.Part?.Uri.ToString() })
                .Select(group => new { group.Key.Description, group.Key.Part, count = group.Count(), path = group.First().Path?.XPath }),
        }));
        failed |= !ok;
    } catch (Exception error) {
        Console.WriteLine(JsonSerializer.Serialize(new { file, ok = false, exception = error.Message }));
        failed = true;
    }
}
return failed ? 1 : 0;
