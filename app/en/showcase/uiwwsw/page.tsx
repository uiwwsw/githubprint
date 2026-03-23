import { permanentRedirect } from "next/navigation";
import { getShowcasePath } from "@/lib/showcase";

export default function LegacyUiwwswEnglishShowcasePage() {
  permanentRedirect(getShowcasePath("uiwwsw", "en"));
}
