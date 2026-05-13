require('dotenv').config({ path: '../.env' });
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function generarLink(aerolinea, origen, destino, fecha_ida, fecha_vuelta) {
  const a = (aerolinea || '').toLowerCase();
  if (a.includes('latam')) {
    return `https://www.latamairlines.com/cl/es/ofertas-vuelos?origin=${origen}&destination=${destino}&outbound=${fecha_ida}&inbound=${fecha_vuelta}&adt=1&cabin=Economy&trip=RT`;
  } else if (a.includes('sky')) {
    return `https://www.skyairline.com/chile/vuelos?from=${origen}&to=${destino}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  } else if (a.includes('jetsmart')) {
    return `https://jetsmart.com/cl/es/flights?from=${origen}&to=${destino}&date=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1`;
  } else if (a.includes('aerolineas') || a.includes('aerolíneas')) {
    return `https://www.aerolineas.com.ar/es-ar/vuelos?from=${origen}&to=${destino}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  } else if (a.includes('avianca')) {
    return `https://www.avianca.com/cl/es/vuelos/?from=${origen}&to=${destino}&departure=${fecha_ida}&return=${fecha_vuelta}&adults=1`;
  } else if (a.includes('copa')) {
    return `https://www.copaair.com/es-cl/vuelos/?origin=${origen}&destination=${destino}&departureDate=${fecha_ida}&returnDate=${fecha_vuelta}&adults=1`;
  } else {
    return `https://www.google.com/travel/flights?q=vuelos+${origen}+a+${destino}`;
  }
}

app.post('/buscar-vuelos', async (req, res) => {
  try {
    const { origen, destino, fecha_ida, fecha_vuelta, preferencias, maleta } = req.body;

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
      return res.json({ respuesta: 'No encontré vuelos disponibles para esas fechas.' });
    }

    const ofertasMapeadas = ofertas.map(o => ({
      id: o.id,
      precio: parseFloat(o.total_amount),
      moneda: o.total_currency,
      aerolinea_ida: o.slices?.[0]?.segments?.[0]?.marketing_carrier?.name,
      aerolinea_vuelta: o.slices?.[1]?.segments?.[0]?.marketing_carrier?.name,
      salida_ida: o.slices?.[0]?.segments?.[0]?.departing_at,
      llegada_ida: o.slices?.[0]?.segments?.[0]?.arriving_at,
      salida_vuelta: o.slices?.[1]?.segments?.[0]?.departing_at,
      llegada_vuelta: o.slices?.[1]?.segments?.[0]?.arriving_at,
    }));

    const necesitaMaleta = maleta === 'true' || maleta === true;

    const notaMaleta = necesitaMaleta
      ? `IMPORTANTE: El empleado necesita maleta de bodega 23kg. DEBES agregar debajo de CADA opción: "💼 MALETA: Este precio no incluye maleta. Agrégala al momento de comprar (+$30-50 USD aprox según aerolínea)"`
      : `El empleado viaja solo con carry on.`;

    const mensaje = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Eres un asistente de viajes corporativos de NotCo.

El empleado busca vuelos de ${origen} a ${destino}.
Fecha ida: ${fecha_ida}, Fecha vuelta: ${fecha_vuelta}
Preferencias de horario: ${preferencias || 'sin preferencia'}
Presupuesto ideal: $500 USD (si no hay opciones bajo ese monto, muestra igual las más económicas y avisa con ⚠️)

${notaMaleta}

INSTRUCCIONES:
- Busca la tarifa más económica
- Prioriza vuelos bajo $500 USD
- Si alguna supera $500 USD indícalo con ⚠️
- Muestra opciones de distintas aerolíneas si hay disponibles
- Presenta las 3 mejores opciones en español con: aerolínea, horarios ida y vuelta, y precio total

VUELOS DISPONIBLES:
${JSON.stringify(ofertasMapeadas, null, 2)}`
      }]
    });

    const aerolineasUnicas = [...new Set(ofertasMapeadas.slice(0, 15).map(o => o.aerolinea_ida).filter(Boolean))];
    const linksTexto = aerolineasUnicas.map(a => `🔗 ${a}: ${generarLink(a, origen, destino, fecha_ida, fecha_vuelta)}`).join('\n');

    const textoFinal = mensaje.content[0].text + `\n\n---\n**🔗 Links de compra (fechas precargadas):**\n${linksTexto}`;

    res.json({ respuesta: textoFinal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Servidor de viajes corriendo en puerto 3001');
});
