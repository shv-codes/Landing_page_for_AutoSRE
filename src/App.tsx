import { useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { Shell } from './components/shell.tsx'
import { StoreProvider } from './lib/store.tsx'
import Home from './pages/home.tsx'
import Product from './pages/product.tsx'
import Pricing from './pages/pricing.tsx'
import Security from './pages/security.tsx'
import DocPage, { DocsIndex } from './pages/docs.tsx'
import { Changelog, Contact, Demo, LegalPage, Status } from './pages/company.tsx'
import { Login, Reset, Signup } from './pages/auth.tsx'
import Checkout, { CheckoutDone } from './pages/checkout.tsx'
import { AccountLayout, Controls, InvoiceDetail, Invoices, Overview, PaymentPage, PlanPage, Usage } from './pages/account.tsx'
import Console from './pages/console.tsx'
import NotFound from './pages/not-found.tsx'

function ScrollReset() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      if (hash) {
        const node = document.querySelector(hash)
        if (node) {
          node.scrollIntoView()
          return
        }
      }
      window.scrollTo(0, 0)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollReset />
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/product" element={<Product />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/security" element={<Security />} />
            <Route path="/docs" element={<DocsIndex />} />
            <Route path="/docs/:slug" element={<DocPage />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/status" element={<Status />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/demo" element={<Demo />} />
            <Route path="/legal/:slug" element={<LegalPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/checkout/done" element={<CheckoutDone />} />
            <Route path="/account" element={<AccountLayout />}>
              <Route index element={<Overview />} />
              <Route path="usage" element={<Usage />} />
              <Route path="plan" element={<PlanPage />} />
              <Route path="controls" element={<Controls />} />
              <Route path="payment" element={<PaymentPage />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
            </Route>
            <Route path="/console" element={<Console />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Shell>
      </StoreProvider>
    </BrowserRouter>
  )
}
