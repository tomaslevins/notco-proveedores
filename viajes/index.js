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

function generarLink(aerolinea, origen, destino, fecha, oneway = false) {
  const o = origen.toUpperCase();
  const d = destino.toUpperCase();
  const a = (aerolinea || '').toLowerCase();
  if (a.includes('latam')) return oneway
    ? `https://www.latamairlines.com/cl/es/ofertas-vuelos?origin=${o}&destination=${d}&outbound=${fecha}&adt=1&cabin=Economy&trip=OW`
    : `https://www.latamairlines.com/cl/es/ofertas-vuelos?origin=${o}&destination=${d}&outbound=${fecha}&adt=1&cabin=Economy&trip=RT`;
  if (a.includes('sky')) return oneway
    ? `https://www.skyairline.com/chile/vuelos?from=${o}&to=${d}&departure=${fecha}&adults=1`
    : `https://www.skyairline.com/chile/vuelos?from=${o}&to=${d}&departure=${fecha}&adults=1`;
  if (a.includes('jetsmart')) return oneway
    ? `https://jetsmart.com/cl/es/flights?from=${o}&to=${d}&date=${fecha}&adults=1`
    : `https://jetsmart.com/cl/es/flights?from=${o}&to=${d}&date=${fecha}&adults=1`;
  if (a.includes('aerolineas') || a.includes('aerolíneas')) return oneway
    ? `https://www.aerolineas.com.ar/es-ar/vuelos?origin=${o}&destination=${d}&outboundDate=${fecha}&adults=1&tripType=OW`
    : `https://www.aerolineas.com.ar/es-ar/vuelos?origin=${o}&destination=${d}&outboundDate=${fecha}&adults=1&tripType=RT`;
  if (a.includes('klm')) return `https://www.google.com/travel/flights?q=vuelos+KLM+${o}+a+${d}+${fecha}`;
  if (a.includes('avianca')) return oneway
    ? `https://www.avianca.com/cl/es/vuelos/?from=${o}&to=${d}&departure=${fecha}&adults=1`
    : `https://www.avianca.com/cl/es/vuelos/?from=${o}&to=${d}&departure=${fecha}&adults=1`;
  if (a.includes('copa')) return oneway
    ? `https://www.copaair.com/es-cl/vuelos/?origin=${o}&destination=${d}&departureDate=${fecha}&adults=1`
    : `https://www.copaair.com/es-cl/vuelos/?origin=${o}&destination=${d}&departureDate=${fecha}&adults=1`;
  if (a.includes('american')) return oneway
    ? `https://www.aa.com/booking/search?locale=es_CL&pax=1&adult=1&type=OW&origin=${o}&destination=${d}&outboundDateString=${fecha}`
    : `https://www.aa.com/booking/search?locale=es_CL&pax=1&adult=1&type=RT&origin=${o}&destination=${d}&outboundDateString=${fecha}`;
  return `https://www.google.com/travel/flights?q=vuelos+${o}+a+${d}+${fecha}`;
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

async function buscarVuelosSerpAPI(origen, destino, fecha_ida, fecha_vuelta, numPasajeros = 1) {
  // Búsqueda solo ida (type=2)
  const urlIda = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origen}&arrival_id=${destino}&outbound_date=${fecha_ida}&type=2&adults=${numPasajeros}&currency=USD&hl=es&gl=cl&api_key=${process.env.SERPAPI_KEY}`;
  const urlVuelta = `https://serpapi.com/search.json?engine=google_flights&departure_id=${destino}&arrival_id=${origen}&outbound_date=${fecha_vuelta}&type=2&adults=${numPasajeros}&currency=USD&hl=es&gl=cl&api_key=${process.env.SERPAPI_KEY}`;

  const [resIda, resVuelta] = await Promise.all([fetch(urlIda), fetch(urlVuelta)]);
  const [dataIda, dataVuelta] = await Promise.all([resIda.json(), resVuelta.json()]);

  // Parsear vuelos de ida
  const vuelosIda = [...(dataIda.best_flights || []), ...(dataIda.other_flights || [])]
    .filter(v => (v.flights || []).length > 0)
    .map(v => {
      const segs = v.flights;
      return {
        precio: v.price || 0,
        aerolinea: segs[0].airline || 'Desconocida',
        salida: segs[0].departure_airport?.time || '',
        llegada: segs[segs.length-1].arrival_airport?.time || '',
        duracion: v.total_duration || 0,
        escalas: segs.length - 1
      };
    })
    .filter(v => v.escalas === 0) // solo directos
    .slice(0, 10);

  // Parsear vuelos de vuelta
  const vuelosVuelta = [...(dataVuelta.best_flights || []), ...(dataVuelta.other_flights || [])]
    .filter(v => (v.flights || []).length > 0)
    .map(v => {
      const segs = v.flights;
      return {
        precio: v.price || 0,
        aerolinea: segs[0].airline || 'Desconocida',
        salida: segs[0].departure_airport?.time || '',
        llegada: segs[segs.length-1].arrival_airport?.time || '',
        duracion: v.total_duration || 0,
        escalas: segs.length - 1
      };
    })
    .filter(v => v.escalas === 0) // solo directos
    .slice(0, 10);

  // Combinar todas las combinaciones y ordenar por precio total
  const combinaciones = [];
  for (const ida of vuelosIda) {
    for (const vuelta of vuelosVuelta) {
      combinaciones.push({
        precio_total: ida.precio + vuelta.precio,
        moneda: 'USD',
        aerolinea_ida: ida.aerolinea,
        salida_ida: ida.salida,
        llegada_ida: ida.llegada,
        duracion_ida: ida.duracion,
        escalas_ida: ida.escalas,
        aerolinea_vuelta: vuelta.aerolinea,
        salida_vuelta: vuelta.salida,
        llegada_vuelta: vuelta.llegada,
        duracion_vuelta: vuelta.duracion,
        escalas_vuelta: vuelta.escalas
      });
    }
  }

  // Ordenar por precio total y retornar top 20
  return combinaciones.sort((a, b) => a.precio_total - b.precio_total).slice(0, 20);
}

app.post('/buscar-vuelos', async (req, res) => {
  try {
    let { origen, destino, fecha_ida, fecha_vuelta, preferencias, nombre, pasajeros } = req.body;

    const necesitaMaleta = pasajeros && pasajeros.toLowerCase().includes('maleta 23kg: sí');
    
    // Contar número de pasajeros desde el texto
    const numPasajeros = pasajeros ? (pasajeros.match(/Pasajero \d+:/g) || ['Pasajero 1:']).length : 1;

    origen = await obtenerCodigoIATA(origen);
    destino = await obtenerCodigoIATA(destino);

    const vuelos = await buscarVuelosSerpAPI(origen, destino, fecha_ida, fecha_vuelta, numPasajeros);

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
Vuelos de ${origen} a ${destino}. Pasajeros: ${numPasajeros}.
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
- Para cada opción muestra SIEMPRE este formato:
  ✈️ Ida: [fecha_ida], [salida_ida] → [llegada_ida] ([aerolinea_ida])
  🔄 Regreso: [fecha_vuelta], [salida_vuelta] → [llegada_vuelta] ([aerolinea_vuelta])
  💰 Precio total: $[precio_total] USD (ida + vuelta)
- Si ida y vuelta son de distintas aerolíneas, destácalo como "✨ Combinación más económica"
- NO menciones que "se requiere validar" ni hagas observaciones sobre datos faltantes

VUELOS DISPONIBLES:
${JSON.stringify(vuelos, null, 2)}`
      }]
    });

    const top3 = vuelos.slice(0, 3);

    const linksTexto = top3.map((v, i) => {
      const mismaAerolinea = v.aerolinea_ida === v.aerolinea_vuelta;
      if (mismaAerolinea) {
        // Round trip en la misma aerolínea
        const linkRT = generarLink(v.aerolinea_ida, origen, destino, fecha_ida, false);
        return `🔗 Opción ${i + 1} - ${v.aerolinea_ida} (ida y vuelta): ${linkRT}`;
      } else {
        // One-way separados
        const linkIda = generarLink(v.aerolinea_ida, origen, destino, fecha_ida, true);
        const linkVuelta = generarLink(v.aerolinea_vuelta, destino, origen, fecha_vuelta, true);
        return `🔗 Opción ${i + 1} - Ida (${v.aerolinea_ida}): ${linkIda}\n🔗 Opción ${i + 1} - Vuelta (${v.aerolinea_vuelta}): ${linkVuelta}`;
      }
    }).join('\n');

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
