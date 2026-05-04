import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { getGasto, formatearMoneda, formatearMonedaCorta } from '../../utils/formatters'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

function TopProveedoresBar({ proveedores, pais }) {
  const top = proveedores
    .filter(p => p.pais === pais && getGasto(p) > 0)
    .sort((a, b) => getGasto(b) - getGasto(a))
    .slice(0, 8)

  if (top.length === 0) {
    return (
      <div className="grafico-card">
        <div className="grafico-titulo">Top proveedores — {pais}</div>
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--gris-texto)', fontSize: 13 }}>
          Sin datos de gasto disponibles
        </div>
      </div>
    )
  }

  const data = {
    labels: top.map(p => p.nombre.length > 22 ? p.nombre.slice(0, 22) + '…' : p.nombre),
    datasets: [
      {
        data: top.map(p => getGasto(p)),
        backgroundColor: pais === 'Chile' ? '#1A1A1A' : '#444444',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `  ${formatearMoneda(ctx.parsed.x, pais)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (val) => formatearMonedaCorta(val),
          font: { size: 11 },
          color: '#9CA3AF',
        },
        grid: { color: '#F0F0F0' },
      },
      y: {
        ticks: { font: { size: 12 }, color: '#1A1A1A' },
        grid: { display: false },
      },
    },
  }

  const moneda = pais === 'Chile' ? 'CLP' : 'ARS'

  return (
    <div className="grafico-card">
      <div className="grafico-titulo">Top proveedores — {pais}</div>
      <div className="grafico-sub">Gasto anual en {moneda}</div>
      <div className="grafico-chart-wrap">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}

function DonutCategoria({ proveedores, pais }) {
  const filtrados = proveedores.filter(p => p.pais === pais)
  const hr = filtrados.filter(p => p.categoria === 'HR').length
  const facilities = filtrados.filter(p => p.categoria === 'Facilities').length
  const otros = filtrados.length - hr - facilities

  const data = {
    labels: ['HR', 'Facilities', 'Otros'],
    datasets: [
      {
        data: [hr, facilities, otros].filter((_, i) => [hr, facilities, otros][i] > 0),
        backgroundColor: ['#2563EB', '#16A34A', '#D1D5DB'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  // Reconstruir labels según los que tienen datos
  const labelsFiltered = ['HR', 'Facilities', 'Otros'].filter((_, i) => [hr, facilities, otros][i] > 0)
  data.labels = labelsFiltered
  data.datasets[0].data = [hr, facilities, otros].filter(v => v > 0)

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 12 }, padding: 14, boxWidth: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `  ${ctx.label}: ${ctx.parsed} proveedores`,
        },
      },
    },
    cutout: '62%',
  }

  return (
    <div className="grafico-card">
      <div className="grafico-titulo">HR vs Facilities — {pais}</div>
      <div className="grafico-sub">{filtrados.length} proveedores en total</div>
      <div className="grafico-donut-wrap">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  )
}

export default function Graficos({ proveedores }) {
  return (
    <>
      <h2 className="dashboard-section-title">Gasto por proveedor</h2>
      <div className="graficos-grid">
        <TopProveedoresBar proveedores={proveedores} pais="Chile" />
        <TopProveedoresBar proveedores={proveedores} pais="Argentina" />
      </div>

      <h2 className="dashboard-section-title">Distribución por categoría</h2>
      <div className="grafico-donuts">
        <DonutCategoria proveedores={proveedores} pais="Chile" />
        <DonutCategoria proveedores={proveedores} pais="Argentina" />
      </div>
    </>
  )
}
