//with pdfjs-dist

const jsLib = require("pdfjs-dist/legacy/build/pdf.mjs");

const filePath = "files/OSHC_Copy.pdf";

async function extract() {
    const loadTask = jsLib.getDocument(filePath);
    const pdf = await loadTask.promise;

    console.log(`Pages: ${pdf.numPages}`);
   // console.log("metadata:",await pdf.getMetadata());

    let fullT = "";
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
    const page = await pdf.getPage(pageNo);
    const content = await page.getTextContent();

    const text = content.items.filter(item => item.str && item.transform) // ignore images
      .map(item => item.str).join(" ");
      fullT += text+ "\n";
    }

    // clean up text
    //fullT = fullT.replace(/\s+/g,"").toLowerCase();

    //extract all dates
      const dateReg = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g;
      let dates = fullT.match(dateReg) || []; //creating an array of dates
      dates = [...new Set(dates)]; // creating a set where duplicates are removed
      
  
      const latest = dates.map(d => new Date(d.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$2/$1/$3")))
                     .sort((a, b) => b - a)[0]; //for finding the latest date to pinpoint the expiry date

    //helper function to get our desired text from the full text             
      function getValueAndDate(text,value){
        const regex = new RegExp(`${value}\\s*:?\\s*([\\w\\-/]+)`, "i");
        const match = text.match(regex);
        return match ? match[1].trim() : null;
      }

    //console.log(fullT);
    const startDate = getValueAndDate(fullT,"cover start date");
    const endtDate = getValueAndDate(fullT,"cover end date")
    //console.log("dates in document:", dates);
    //console.log("cover start date:", startDate );
    console.log("cover end date:" ,latest?.toLocaleDateString("en-AU"));
  }
    



extract().catch(console.error);