import Site from "@/components/Site";
import FileUpload from "./FileUpload";

export default async function HomePage() {
  return (
    <Site title="Unsere Fotos für unsere Pfarre" showTitle>
      <div className="flex flex-col gap-12 lg:flex-row">
        <div className="flex flex-col gap-4">
          <div>
            Ihr seid bei Veranstaltungen dabei, helft mit und erlebt die
            schönsten Momente in unserer Pfarre mit. Teilt eure besten
            Schnappschüsse mit uns! Ob vom Pfarrfest, Gottesdienst oder anderen
            Events – eure Fotos helfen uns dabei, zu zeigen, wie lebendig unsere
            Gemeinschaft ist. Einfach hochladen und fertig!
          </div>
        </div>
        <FileUpload />
      </div>
    </Site>
  );
}
