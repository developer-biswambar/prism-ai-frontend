import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { initializeDatadog } from './config/datadog.js'

// Initialize Datadog RUM as early as possible
initializeDatadog()

ReactDOM.createRoot(document.getElementById('root')).render(
    <App/>
)
