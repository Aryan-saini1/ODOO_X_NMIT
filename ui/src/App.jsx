import './App.css'
import ProductBom from './components/ProductBom'
import Mo from './components/Mo'
import Inventory from './components/Inventory'
import Wo from './components/Wo'
import DatabaseData from './components/DatabaseData'
import { useEffect, useState } from 'react'

function App() {
  const [token, setToken] = useState(null)

  useEffect(() => {
    // In a real app, you'd get this from a login flow
    const demoToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLWFkbWluIiwicm9sZXMiOlsiYWRtaW4iXSwiaWF0IjoxNjYyNTk1MjAwfQ.YOUR_SIGNATURE'
    setToken(demoToken)
  }, [])

  return (
    <>
      <h1>ODOO X NMIT - API Test UI</h1>
      <div className="container">
        <ProductBom />
        <Mo />
        <Inventory />
        <Wo />
        <DatabaseData token={token} />
      </div>
    </>
  )
}

export default App
