declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
  }
  function html2pdf(): {
    set(opt: Html2PdfOptions): ReturnType<typeof html2pdf>;
    from(element: HTMLElement): ReturnType<typeof html2pdf>;
    save(): Promise<void>;
  };
  export default html2pdf;
}
