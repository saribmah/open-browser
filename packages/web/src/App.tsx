import { Routes, Route } from "react-router"
import { Layout } from "./components/Layout"
import HomePage from "./pages/home"
import Chat from "./pages/chat"

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<Chat />} />
      </Routes>
    </Layout>
  )
}
