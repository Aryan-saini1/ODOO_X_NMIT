import './App.css'
import ProductBom from './components/ProductBom'
import Mo from './components/Mo'
import Inventory from './components/Inventory'
import Wo from './components/Wo'

function App() {
  return (
    <>
      <h1>ODOO X NMIT - API Test UI</h1>
      <div className="container">
        <ProductBom />
        <Mo />
        <Inventory />
        <Wo />
      </div>
    </>
  )
}

export default App
