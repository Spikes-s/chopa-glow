import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  deliveryType: string;
  mpesaCode?: string;
  emailType: 'order_placed' | 'payment_confirmed' | 'order_ready' | 'order_completed';
}

const getEmailContent = (data: OrderEmailRequest) => {
  const itemsList = data.items
    .map(item => `<li>${item.quantity}x ${item.name} - Ksh ${item.price.toLocaleString()}</li>`)
    .join('');

  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #ec4899, #a855f7); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
      .content { background: #fafafa; padding: 30px; border: 1px solid #e5e5e5; }
      .footer { background: #1a1a1a; color: #888; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }
      .order-id { background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; }
      .total { font-size: 24px; color: #ec4899; font-weight: bold; }
      ul { padding-left: 20px; }
    </style>
  `;

  switch (data.emailType) {
    case 'order_placed':
      return {
        subject: `Order Received - ${data.orderId.slice(0, 8)}`,
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Thank You for Your Order!</h1>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>We've received your order and it's being processed.</p>
              <p class="order-id">Order ID: ${data.orderId.slice(0, 8)}</p>
              ${data.mpesaCode ? `<p><strong>M-Pesa Code:</strong> ${data.mpesaCode}</p>` : ''}
              <h3>Order Details:</h3>
              <ul>${itemsList}</ul>
              <p class="total">Total: Ksh ${data.total.toLocaleString()}</p>
              <p><strong>Delivery Method:</strong> ${data.deliveryType === 'delivery' ? 'Delivery' : 'Store Pickup'}</p>
              <p>We'll notify you once your payment is confirmed.</p>
            </div>
            <div class="footer">
              <p>Chopa Beauty - Your Beauty Destination</p>
            </div>
          </div>
        `,
      };

    case 'payment_confirmed':
      return {
        subject: `Payment Confirmed - Order ${data.orderId.slice(0, 8)}`,
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Payment Confirmed! ✓</h1>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Your payment of <span class="total">Ksh ${data.total.toLocaleString()}</span> has been confirmed.</p>
              <p class="order-id">Order ID: ${data.orderId.slice(0, 8)}</p>
              <p>Your order is now being prepared. We'll notify you when it's ready!</p>
            </div>
            <div class="footer">
              <p>Chopa Beauty - Your Beauty Destination</p>
            </div>
          </div>
        `,
      };

    case 'order_ready':
      return {
        subject: `Order Ready - ${data.orderId.slice(0, 8)}`,
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Your Order is Ready! 🎉</h1>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Great news! Your order is ready ${data.deliveryType === 'delivery' ? 'for delivery' : 'for pickup at our store'}.</p>
              <p class="order-id">Order ID: ${data.orderId.slice(0, 8)}</p>
              ${data.deliveryType === 'pickup' ? '<p><strong>Location:</strong> KAKA HOUSE</p><p><strong>Hours:</strong> 7:30 AM – 9:00 PM</p>' : '<p>Our delivery team will contact you shortly.</p>'}
            </div>
            <div class="footer">
              <p>Chopa Beauty - Your Beauty Destination</p>
            </div>
          </div>
        `,
      };

    case 'order_completed':
      return {
        subject: `Order Complete - Thank You! ${data.orderId.slice(0, 8)}`,
        html: `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h1>Order Complete! 💖</h1>
            </div>
            <div class="content">
              <p>Hi ${data.customerName},</p>
              <p>Your order has been completed successfully. Thank you for shopping with us!</p>
              <p class="order-id">Order ID: ${data.orderId.slice(0, 8)}</p>
              <p>We hope you love your products. See you again soon!</p>
            </div>
            <div class="footer">
              <p>Chopa Beauty - Your Beauty Destination</p>
            </div>
          </div>
        `,
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderEmailRequest = await req.json();

    if (!data.customerEmail) {
      return new Response(
        JSON.stringify({ error: "No customer email provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailContent = getEmailContent(data);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Chopa Beauty <onboarding@resend.dev>",
        to: [data.customerEmail],
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const emailResult = await emailResponse.json();

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify(emailResult), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
