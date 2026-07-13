import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import AboutPage from "./pages/AboutPage";
import ChatPage from "./pages/ChatPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import SearchPage from "./pages/SearchPage";
import UploadPage from "./pages/UploadPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/results/:reportId" element={<ResultsPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat/:docId" element={<ChatPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Layout>
  );
}
