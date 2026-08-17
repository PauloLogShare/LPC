import * as XLSX from "xlsx";

export function readExcel(file, callback) {
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    
    // O SEGREDO: cellDates obriga o Excel a entregar datas verdadeiras em vez de textos malucos!
    const workbook = XLSX.read(data, {
      type: "array",
      cellDates: true, 
    });
    
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);
    
    callback(json);
  };

  reader.readAsArrayBuffer(file);
}
