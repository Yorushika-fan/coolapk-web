import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Home from '@/pages/Home'
import Feed from '@/pages/Feed'
import Search from '@/pages/Search'
import User from '@/pages/User'
import Topic from '@/pages/Topic'
import Page from '@/pages/Page'
import Settings from '@/pages/Settings'
import NotFound from '@/pages/NotFound'
import { BackToTop } from '@/components/BackToTop'
import { useThemeStore } from '@/stores/theme'

export default function App() {
  useEffect(() => {
    useThemeStore.getState().init()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/feed/:id" element={<Feed />} />
        <Route path="/search" element={<Search />} />
        <Route path="/u/:uid" element={<User />} />
        <Route path="/t/:tag" element={<Topic />} />
        <Route path="/p/:slug" element={<Page />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BackToTop />
    </BrowserRouter>
  )
}
