import { redirect } from "next/navigation";

/** Legacy URL — advanced assistant lives at `/client/ai-assistant`. */
export default function AISupportRedirectPage() {
  redirect("/client/ai-assistant");
}
