import { FileText } from "lucide-react";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";

const IMAGE_EXT = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

function isImage(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return IMAGE_EXT.has(ext);
}

export interface UploadedFileEntry {
  id: string;
  name: string;
  url: string | null;
  kind?: string;
}

/** Clickable thumbnail grid for already-uploaded enquiry files (signed URLs from private storage). */
export function UploadedFilesCard({ title, files }: { title: string; files: UploadedFileEntry[] }) {
  if (!files.length) return null;

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardBody>
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {files.map((f) => (
            <li key={f.id}>
              <a
                href={f.url ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                title={f.url ? `View ${f.name}` : `${f.name} (link expired)`}
                className={`flex aspect-square flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 ${
                  f.url ? "hover:border-gold-500" : "pointer-events-none opacity-60"
                }`}
              >
                {f.url && isImage(f.name) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt={f.name} className="h-full w-full object-cover" />
                ) : (
                  <>
                    <FileText className="h-6 w-6 text-neutral-400" />
                    <span className="px-1 text-center text-[10px] text-neutral-500">
                      {f.name.split(".").pop()?.toUpperCase() || "FILE"}
                    </span>
                  </>
                )}
              </a>
              <p className="mt-1 truncate text-[11px] text-neutral-500">{f.name}</p>
              {f.kind && <p className="truncate text-[10px] text-neutral-400">{f.kind}</p>}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
