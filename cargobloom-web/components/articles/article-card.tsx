import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import Link from "next/link"

interface ArticleCardProps {
    title: string
    summary: string
    imageUrl: string
    source: string
    timeAgo: string
    tags?: string[]
    slug: string
}

export function ArticleCard({
    title,
    summary,
    imageUrl,
    source,
    timeAgo,
    tags = [],
    slug,
}: ArticleCardProps) {
    return (
        <Link href={`/articles/${slug}`} className="group flex flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md h-full">
            <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
            <div className="flex flex-col flex-1 p-5">
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{source}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{timeAgo}</span>
                    </div>
                </div>

                <h3 className="text-lg font-bold leading-tight mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-1">
                    {summary}
                </p>

                <div className="flex flex-wrap gap-2 mt-auto">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs font-normal">
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>
        </Link>
    )
}
