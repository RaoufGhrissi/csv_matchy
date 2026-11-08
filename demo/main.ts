import { Matchy, type Labels, type Settings } from "sheet-matchy";
import { browserOptions, fakeImportApi, serverOptions, type Lang, type Line } from "./catalog";

type Mode = "browser" | "server";

const frenchLabels: Partial<Labels> = {
  selectFile: "Choisir un fichier Excel :",
  preSubmit: "Vérifier",
  submit: "Envoyer",
  reset: "Réinitialiser",
  export: "Exporter en CSV",
  confirmDelete: "Supprimer cette ligne ?",
  noFile: "Choisissez un fichier.",
  wrongFileType: "Choisissez un fichier Excel (.xlsx).",
  unreadableFile: "Impossible de lire ce fichier. Vérifiez que c'est un fichier .xlsx valide.",
  noMatchedColumns: "Associez au moins une colonne avant d'exporter.",
  errorCount: "{count} cellule(s) invalide(s). Cliquez sur une cellule en rouge pour la corriger.",
  noErrors: "Toutes les cellules sont valides. Vous pouvez envoyer.",
  previous: "Précédent",
  next: "Suivant",
  pageInfo: "Lignes {start}-{end} sur {total}",
  page: "Page {page} sur {pages}",
  mandatoryMissing: "Champ obligatoire manquant",
  invalidInteger: "Ce n'est pas un nombre entier",
  invalidFloat: "Ce n'est pas un nombre",
  invalidBool: "Valeurs possibles : 'Yes' ou 'No'",
  regexMismatch: "Format attendu : {pattern}",
  lengthMismatch: "La longueur n'est pas {comparer} {value}",
  valueMismatch: "La valeur n'est pas {comparer} {value}",
  comparerGt: "supérieure à",
  comparerGte: "supérieure ou égale à",
  comparerLt: "inférieure à",
  comparerLte: "inférieure ou égale à",
  comparerE: "égale à",
  comparerIn: "dans",
};

const pageTexts = {
  en: {
    tagline:
      "A web component to import spreadsheets: match the columns, fix the invalid cells, then submit clean data to your app.",
    stepDownload: "Download the",
    sample: "sample product file",
    sampleFile: "products.xlsx",
    stepDownloadAfter: "It has a few mistakes on purpose.",
    stepChoose: "Choose it below. Columns are matched to fields from their headers.",
    stepFix: "Fix the cells in red by clicking them, then submit.",
    tabBrowser: "Validation in the browser",
    tabServer: "Validation on a server",
    resultTitle: "What your app receives",
    help: {
      browser:
        "matchy checks every cell in the browser: required values, numbers, the SKU format and the category list. Submit stays disabled until no cell is invalid.",
      server:
        "matchy only matches the columns and sends every cell with its row and column. A server checks them (here simulated in the page) and returns the wrong cells, which matchy colors.",
    },
    nothing: "Nothing submitted yet.",
    received: "{count} line(s) ready to import. First lines:",
    checking: "Sending {count} line(s) to the server…",
    rejected: "The server rejected {count} cell(s). Nothing was saved. Fix them and submit again.",
    created: "The server imported {count} product(s).",
  },
  fr: {
    tagline:
      "Un composant web pour importer des tableurs : associez les colonnes, corrigez les cellules invalides, puis envoyez des données propres à votre application.",
    stepDownload: "Téléchargez le",
    sample: "fichier de produits d'exemple",
    sampleFile: "produits.xlsx",
    stepDownloadAfter: "Il contient quelques erreurs exprès.",
    stepChoose: "Choisissez-le ci-dessous. Les colonnes sont associées aux champs d'après leurs en-têtes.",
    stepFix: "Corrigez les cellules en rouge en cliquant dessus, puis envoyez.",
    tabBrowser: "Validation dans le navigateur",
    tabServer: "Validation sur un serveur",
    resultTitle: "Ce que reçoit votre application",
    help: {
      browser:
        "matchy vérifie chaque cellule dans le navigateur : valeurs obligatoires, nombres, format de référence et liste de catégories. Envoyer reste désactivé tant qu'une cellule est invalide.",
      server:
        "matchy associe seulement les colonnes et envoie chaque cellule avec sa ligne et sa colonne. Un serveur les vérifie (simulé ici dans la page) et renvoie les cellules en erreur, que matchy colore.",
    },
    nothing: "Rien n'a encore été envoyé.",
    received: "{count} ligne(s) prête(s) à importer. Premières lignes :",
    checking: "Envoi de {count} ligne(s) au serveur…",
    rejected: "Le serveur a refusé {count} cellule(s). Rien n'a été enregistré. Corrigez-les puis renvoyez.",
    created: "Le serveur a importé {count} produit(s).",
  },
};

let mode: Mode = "browser";
let lang: Lang = "en";

const importer = document.getElementById("importer")!;
const help = document.getElementById("mode-help")!;
const status = document.getElementById("result-status")!;
const data = document.getElementById("result-data") as HTMLPreElement;

function showResult(message: string, payload?: unknown) {
  status.textContent = message;
  data.hidden = payload === undefined;
  data.textContent = payload === undefined ? "" : JSON.stringify(payload, null, 2);
}

function render() {
  const texts = pageTexts[lang];
  const settings: Settings = {
    pagination: { enabled: true, itemsPerPage: 10 },
    labels: lang === "fr" ? frenchLabels : {},
  };
  const matchy =
    mode === "browser"
      ? new Matchy(browserOptions(lang), { ...settings, blockInvalidSubmit: true })
      : new Matchy(serverOptions(lang), { ...settings, validate: false });

  matchy.submit = async ({ lines }) => {
    if (mode === "browser") {
      showResult(texts.received.replace("{count}", String(lines.length)), lines.slice(0, 3));
      return;
    }
    showResult(texts.checking.replace("{count}", String(lines.length)));
    const response = await fakeImportApi(lines as unknown as Line[], lang);
    matchy.markWrongCells(response.wrong_cells);
    if (response.error) {
      showResult(response.error, response);
    } else if (response.wrong_cells.length) {
      showResult(texts.rejected.replace("{count}", String(response.wrong_cells.length)), response);
    } else {
      showResult(texts.created.replace("{count}", String(response.created)), response);
    }
  };

  importer.replaceChildren(matchy);
  const setText = (id: string, text: string) => {
    document.getElementById(id)!.textContent = text;
  };
  setText("tagline", texts.tagline);
  setText("step-download", texts.stepDownload);
  setText("sample", texts.sample);
  setText("step-download-after", texts.stepDownloadAfter);
  setText("step-choose", texts.stepChoose);
  setText("step-fix", texts.stepFix);
  setText("tab-browser", texts.tabBrowser);
  setText("tab-server", texts.tabServer);
  setText("result-title", texts.resultTitle);
  const sample = document.getElementById("sample") as HTMLAnchorElement;
  sample.href = `./${texts.sampleFile}`;
  sample.download = texts.sampleFile;
  help.textContent = texts.help[mode];
  showResult(texts.nothing);
  document.documentElement.lang = lang;
  for (const [id, selected] of [
    ["tab-browser", mode === "browser"],
    ["tab-server", mode === "server"],
  ] as const) {
    document.getElementById(id)!.setAttribute("aria-selected", String(selected));
  }
  document.getElementById("lang-en")!.setAttribute("aria-pressed", String(lang === "en"));
  document.getElementById("lang-fr")!.setAttribute("aria-pressed", String(lang === "fr"));
}

document.getElementById("tab-browser")!.addEventListener("click", () => {
  mode = "browser";
  render();
});
document.getElementById("tab-server")!.addEventListener("click", () => {
  mode = "server";
  render();
});
document.getElementById("lang-en")!.addEventListener("click", () => {
  lang = "en";
  render();
});
document.getElementById("lang-fr")!.addEventListener("click", () => {
  lang = "fr";
  render();
});

render();
