import axios from 'axios';
import pdfkit from "pdfkit";
import { pipeline, Writable } from "stream";
import { promisify } from "util";


export const generateEventDetailsPDF = async (eventDetails) => {
    const pdfStream = new pdfkit();
  
    pdfStream.text("Event Details");
    pdfStream.text(`Title: ${eventDetails.title}`);
    pdfStream.text(`Description: ${eventDetails.description}`);
    pdfStream.text(`Venue: ${eventDetails.venue}`);
    pdfStream.text(`Date: ${eventDetails.event_date}`);
    pdfStream.text(`Start Time: ${eventDetails.start_time}`);
    pdfStream.text(`End Time: ${eventDetails.end_time}`);
  
    // Embed event photo in the PDF
    if (eventDetails.photo) {
      const photoBuffer = await fetchImageAsBuffer(eventDetails.photo);
      pdfStream.image(photoBuffer, { width: 200 });
    }
  
    pdfStream.end();
  
    const pdfBuffer = await streamToBuffer(pdfStream);
    return pdfBuffer.toString("base64");
  };
  
  
  const pipelineAsync = promisify(pipeline);

  const streamToBuffer = async (stream) => {
    try {
      const chunks = [];
      await pipelineAsync(
        stream,
        new Writable({ write: (chunk, encoding, callback) => callback() })
      );
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('Error in streamToBuffer:', error);
      throw error; 
    }
  };
  
  const fetchImageAsBuffer = async (imageUrl) => {
    try {
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      return Buffer.from(response.data, 'binary');
    } catch (error) {
      console.error(`Failed to fetch image from ${imageUrl}:`, error.message);
      throw error;
    }
  };