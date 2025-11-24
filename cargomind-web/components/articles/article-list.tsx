import Image from "next/image"
import { Clock } from "lucide-react"
import Link from "next/link"

interface ArticleItemProps {
    title: string
    source: string
    timeAgo: string
    imageUrl?: string
    slug: string
}

export function ArticleListItem({ title, source, timeAgo, imageUrl, slug }: ArticleItemProps) {
    return (
        <Link href={`/articles/${slug}`} className="group flex gap-4 items-start p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex-1 space-y-2">
                <h3 className="font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{source}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                    </div>
                </div>
            </div>
            {imageUrl && (
                <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                </div>
            )}
        </Link>
    )
}

interface ArticleListProps {
    articles: ArticleItemProps[]
}

export function ArticleList({ articles }: ArticleListProps) {
    return (
        <div className="flex flex-col divide-y divide-border/50">
            {articles.map((article, index) => (
                <ArticleListItem key={index} {...article} />
            ))}
        </div>
    )
}
