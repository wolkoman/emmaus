import Link from "next/link";
import { PiEnvelopeBold } from "react-icons/pi";

export function ContactSection() {
  return (
    <>
      <div className="mb-44">
        <div className="grid place-items-center gap-4 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="text-3xl font-bold">
              Wir freuen uns, von Dir zu hören!
            </div>
            <div className="text-lg">
              <span className="font-bold italic"></span> Ob Du Fragen hast, ein
              Anliegen teilen oder einfach nur den ersten Schritt zu unserer
              Gemeinschaft machen möchtest. Begegne uns nach der Heilige Messe
              oder schreib unserem Pfarrer Dr. Zvonko Brezovski!
            </div>
            <div className="flex grow flex-col items-start justify-end gap-4">
              <Link
                href="mailto:kanzlei@emmaus.wien"
                className="inline-flex items-center gap-2 rounded-xl border border-black/5 bg-white/70 px-8 py-4 text-lg font-semibold shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <PiEnvelopeBold /> pfarrer@emmaus.wien
              </Link>
            </div>
          </div>
          <div
            style={{
              backgroundImage: `url(https://api.emmaus.wien/files/folder_6a21c02de166f1.87502911/full/img_6a21c0495ae3f5.63561570.jpg)`,
            }}
            className="relative aspect-[16/20] w-full rounded-xl bg-cover bg-center shadow-xl"
          />
        </div>
      </div>
    </>
  );
}
