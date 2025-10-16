import QRCode from 'qrcode';

export const generateQRCode = async (baseUrl, data) => {
  try {
    const qrcode = await QRCode.toDataURL(`${baseUrl}/verify-ticket/${data}`);
    // console.log(qrcode);
    return qrcode;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};


import { format } from 'date-fns';

export const calculateTicket = (event, quantity) => {
    const totalCost = event.price * quantity;
    
    const formattedEventDate = format(new Date(event.starts), "iiii do, MMM yyyy");
    const formattedEventTime = format(new Date(event.event_date), "h:mm a");

    const ticketDetails = {
      eventId: event.eventId,
      eventTitle: event.title,
      eventVenue: event.venue,
      eventDate: formattedEventDate,
      eventTime: formattedEventTime,
      quantity,
      price: event.price,
      totalCost,
      photoUrl: event.photo
    };

    return { ticketDetails };
};

  export const processPayment = async ({ ticketId, paymentMethod, cardNumber, expirationDate, cvv }) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`Payment processed successfully for ticket ${ticketId}`);
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw new Error('Failed to process payment');
    }
  };

  
