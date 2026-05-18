require('dotenv').config({ path: '../.env' });
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function obtenerCodigoIATA(ciudad) {
  try {
    const msg = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 10,
      messages: [{
        role: 'user',
        content: `Responde SOLO con el código IATA del aeropuerto principal de: "${ciudad}". Solo 3 letras, nada más.`
      }]
    });
    const codigo = msg.content[0].text.trim().toUpperCase().replace(/[^A-Z]/g, '');
    return codigo.length === 3 ? codigo : ciudad.toUpperCase();
  } catch (e) {
    return ciudad.toUpperCase();
  }
}

function generarLink(aerolinea, origen, destino, fecha_ida, fecha_vuelta) {
  const o = origen.toUpperCase();
  const d = destino.toUpperCase();
  const a = (aerolinea || '').toLowerCase();
  if (a.includes('latam')) return `https://www.latamairlines.com/cl/es/ofertas-vuelos?origin=${o}&destination=${d}&outbound=${fecha_ida}&inbound=${fecha_vuelta}&adt=1&cabin=Economy&trip=RT`;
  if (a.includes('sky')) return `https://www.skyairline.com/chile/vuelos?from=${o}&to=${d}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  if (a.includes('jetsmart')) return `https://jetsmart.com/cl/es/flights?from=${o}&to=${d}&date=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1`;
  if (a.includes('aerolineas') || a.includes('aerolíneas')) return `https://www.aerolineas.com.ar/es-ar/vuelos?from=${o}&to=${d}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  if (a.includes('avianca')) return `https://www.avianca.com/cl/es/vuelos/?from=${o}&to=${d}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  if (a.includes('copa')) return `https://www.copaair.com/es-cl/vuelos/?origin=${o}&destination=${d}&departureDate=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1`;
  if (a.includes('american')) return `https://www.aa.com/booking/search?locale=es_CL&pax=1&adult=1&type=RT&origin=${o}&destination=${d}&outboundDateString=${fecha_ida}&returnDateString=${fecha_vuelta}`;
  return `https://www.google.com/travel/flights?q=vuelos+${o}+a+${d}`;
}

function markdownAHtml(texto) {
  return texto
    .replace(/#{1,3} (.*)/g, '<h3 style="margin:16px 0 8px;color:#111;font-size:15px">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/---/g, '<hr style="border:none;border-top:1px solid #ebebea;margin:12px 0">')
    .replace(/\n\n/g, '</p><p style="margin:6px 0;font-size:13px;color:#111">')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p style="margin:6px 0;font-size:13px;color:#111">')
    .replace(/$/, '</p>')
    .replace(/🔗 (.*?): (https?:\/\/[^\s<]+)/g, '🔗 <a href="$2" style="color:#111;font-weight:600">$1</a>');
}

app.post('/buscar-vuelos', async (req, res) => {
  try {
    let { origen, destino, fecha_ida, fecha_vuelta, preferencias, nombre, pasajeros } = req.body;

    const necesitaMaleta = pasajeros && pasajeros.toLowerCase().includes('maleta 23kg: sí');

    origen = await obtenerCodigoIATA(origen);
    destino = await obtenerCodigoIATA(destino);

    const response = await fetch('https://api.duffel.com/air/offer_requests', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DUFFEL_TOKEN}`,
        'Duffel-Version': 'v2',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          slices: [
            { origin: origen, destination: destino, departure_date: fecha_ida },
            { origin: destino, destination: origen, departure_date: fecha_vuelta }
          ],
          passengers: [{ type: 'adult' }],
          cabin_class: 'economy'
        }
      })
    });

    const duffelData = await response.json();
    const ofertas = duffelData.data?.offers?.slice(0, 30) || [];

    if (ofertas.length === 0) {
      return res.json({ respuesta: 'No se encontraron vuelos disponibles para esas fechas.' });
    }

    const ofertasMapeadas = ofertas.map(o => ({
      precio: parseFloat(o.total_amount),
      moneda: o.total_currency,
      aerolinea_ida: o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name,
      aerolinea_vuelta: o.slices?.[1]?.segments?.[0]?.marketing_carrier?.name,
      salida_ida: o.slices?.[0]?.segments?.[0]?.departing_at,
      llegada_ida: o.slices?.[0]?.segments?.[0]?.arriving_at,
      salida_vuelta: o.slices?.[1]?.segments?.[0]?.departing_at,
      llegada_vuelta: o.slices?.[1]?.segments?.[0]?.arriving_at,
    }));

    const notaMaleta = necesitaMaleta
      ? `IMPORTANTE: El empleado necesita maleta de bodega 23kg. Debajo de CADA opción agrega exactamente: "💼 Recordar agregar maleta de bodega al momento de comprar (+$30-50 USD aprox según aerolínea)"`
      : `El empleado viaja con carry on.`;

    const mensaje = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un asistente de viajes corporativos de NotCo que prepara un informe para el equipo de People/Facilities.

Solicitante: ${nombre || 'Empleado NotCo'}
Vuelos de ${origen} a ${destino}.
Fecha ida: ${fecha_ida}, Fecha vuelta: ${fecha_vuelta}
Preferencias: ${preferencias || 'sin preferencia'}
Presupuesto ideal: $500 USD (si no hay opciones bajo ese monto, muestra las más económicas y avisa con ⚠️)

${notaMaleta}

INSTRUCCIONES ESTRICTAS:
- Presenta las 3 mejores opciones
- NO incluyas IDs de oferta en ningún caso
- NO uses frases como "¿te gustaría proceder?" o "¿deseas reservar?"
- NO menciones "Duffel Airways" — ignórala completamente
- Prioriza vuelos bajo $500 USD
- Muestra distintas aerolíneas si hay disponibles
- Formato: aerolínea, horarios ida y vuelta, precio total

VUELOS DISPONIBLES:
${JSON.stringify(ofertasMapeadas, null, 2)}`
      }]
    });

    // Generar links por cada opción (top 3 aerolíneas)
    const top3 = ofertasMapeadas
      .filter(o => o.aerolinea_ida && !o.aerolinea_ida.toLowerCase().includes('duffel'))
      .slice(0, 3);

    const linksTexto = top3.map((o, i) => 
      `🔗 Opción ${i+1} - ${o.aerolinea_ida}: ${generarLink(o.aerolinea_ida, origen, destino, fecha_ida, fecha_vuelta)}`
    ).join('\n');

    const textoFinal = mensaje.content[0].text + `\n\n---\n**Links de compra (fechas precargadas):**\n${linksTexto}`;
    const htmlFinal = markdownAHtml(textoFinal);

    res.json({ respuesta: htmlFinal });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Servidor de viajes corriendo en puerto 3001');
});
