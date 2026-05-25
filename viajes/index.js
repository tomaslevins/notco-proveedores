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
  if (a.includes('aerolineas') || a.includes('aerolíneas')) return `https://www.aerolineas.com.ar/es-ar/vuelos?origin=${o}&destination=${d}&outboundDate=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1&tripType=RT`;
  if (a.includes('klm')) return `https://www.klm.com/search/flights?origin=${o}&destination=${d}&outboundDate=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1&cabinClass=ECONOMY`;
  if (a.includes('avianca')) return `https://www.avianca.com/cl/es/vuelos/?from=${o}&to=${d}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  if (a.includes('copa')) return `https://www.copaair.com/es-cl/vuelos/?origin=${o}&destination=${d}&departureDate=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1`;
  if (a.includes('american')) return `https://www.aa.com/booking/search?locale=es_CL&pax=1&adult=1&type=RT&origin=${o}&destination=${d}&outboundDateString=${fecha_ida}&returnDateString=${fecha_vuelta}`;
  // Fallback: Google Flights con ruta y fechas precargadas
  return `https://www.google.com/travel/flights/search?tfs=CBwQARoaEgoyMDI2LTA5LTAxagcIARIDU0NMcgcIARIDRVpFGhoSCjIwMjYtMDktMDVqBwgBEgNFWkVyBwgBEgNTQ0w`;
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

async function buscarVuelosSerpAPI(origen, destino, fecha_ida, fecha_vuelta) {
  const urlIda = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origen}&arrival_id=${destino}&outbound_date=${fecha_ida}&return_date=${fecha_vuelta}&currency=USD&hl=es&gl=cl&api_key=${process.env.SERPAPI_KEY}`;

  const response = await fetch(urlIda);
  const data = await response.json();
  console.log('SerpAPI response:', JSON.stringify(data, null, 2));

  const vuelos = [];

  const todasOfertas = [
    ...(data.best_flights || []),
    ...(data.other_flights || [])
  ];

  for (const vuelo of todasOfertas) {
    const flights = vuelo.flights || [];
    if (flights.length === 0) continue;

    const primerSegmento = flights[0];
    const ultimoSegmento = flights[flights.length - 1];

    // Vuelo de regreso
    const returnFlights = vuelo.return_flights?.flights || vuelo.layovers?.return_flights || [];
    const primerSegmentoVuelta = returnFlights[0] || null;
    const ultimoSegmentoVuelta = returnFlights[returnFlights.length - 1] || null;

    vuelos.push({
      precio: vuelo.price,
      moneda: 'USD',
      aerolinea_ida: primerSegmento.airline || 'Desconocida',
      salida_ida: primerSegmento.departure_airport?.time || '',
      llegada_ida: ultimoSegmento.arrival_airport?.time || '',
      duracion_ida: vuelo.total_duration || 0,
      escalas_ida: flights.length - 1,
      aerolinea_vuelta: primerSegmentoVuelta?.airline || primerSegmento.airline || 'Desconocida',
      salida_vuelta: primerSegmentoVuelta?.departure_airport?.time || '',
      llegada_vuelta: ultimoSegmentoVuelta?.arrival_airport?.time || '',
      escalas_vuelta: returnFlights.length > 0 ? returnFlights.length - 1 : 0,
    });
  }

  return vuelos.slice(0, 30);
}

app.post('/buscar-vuelos', async (req, res) => {
  try {
    let { origen, destino, fecha_ida, fecha_vuelta, preferencias, nombre, pasajeros } = req.body;

    const necesitaMaleta = pasajeros && pasajeros.toLowerCase().includes('maleta 23kg: sí');

    origen = await obtenerCodigoIATA(origen);
    destino = await obtenerCodigoIATA(destino);

    const vuelos = await buscarVuelosSerpAPI(origen, destino, fecha_ida, fecha_vuelta);

    if (vuelos.length === 0) {
      return res.json({ respuesta: 'No se encontraron vuelos disponibles para esas fechas.' });
    }

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
- NO uses frases como "¿te gustaría proceder?" o "¿deseas reservar?"
- Prioriza vuelos bajo $500 USD
- Prioriza SIEMPRE vuelos directos (sin escalas). Si no hay vuelos directos disponibles, menciona las escalas claramente con ⚠️
- Muestra distintas aerolíneas si hay disponibles
- Formato: aerolínea, horarios ida, precio total, número de escalas
- El precio mostrado SIEMPRE incluye ida y vuelta (round trip) — indícalo claramente en cada opción
- Para cada opción muestra SIEMPRE:
  ✈️ Ida: [fecha_ida], [salida_ida] → [llegada_ida]
  🔄 Regreso: [fecha_vuelta], [salida_vuelta] → [llegada_vuelta] (si salida_vuelta está vacío, indica "ver horarios en el link de compra")
- NO menciones que "se requiere validar" ni hagas observaciones sobre datos faltantes

VUELOS DISPONIBLES:
${JSON.stringify(vuelos, null, 2)}`
      }]
    });

    const top3 = vuelos.slice(0, 3);

    const linksTexto = top3.map((v, i) =>
      `🔗 Opción ${i + 1} - ${v.aerolinea_ida}: ${generarLink(v.aerolinea_ida, origen, destino, fecha_ida, fecha_vuelta)}`
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
