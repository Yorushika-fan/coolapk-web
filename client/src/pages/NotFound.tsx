import { Link } from 'react-router'
import { MainShell } from '@/components/MainShell'

export default function NotFound() {
  return (
    <MainShell>
      <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <h1 className="text-2xl font-semibold">页面不存在</h1>
        <p className="text-sm text-muted-foreground">
          你要找的页面已经飞走了。
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          返回首页
        </Link>
      </div>
    </MainShell>
  )
}
