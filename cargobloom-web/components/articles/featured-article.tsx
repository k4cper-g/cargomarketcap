import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import Link from "next/link"

interface FeaturedArticleProps {
    title: string
    summary: string
    imageUrl: string
    source: string
    timeAgo: string
    tags?: string[]
    slug: string
}

export function FeaturedArticle({
    title,
    summary,
    imageUrl,
    source,
    timeAgo,
    tags = [],
    slug,
}: FeaturedArticleProps) {
    return (
        <Link href={`/articles/${slug}`} className="block group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="relative aspect-video md:aspect-auto overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                </div>
                <div className="flex flex-col justify-center p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-primary">{source[0]}</span>
                            </div>
                            <span className="text-sm font-medium text-muted-foreground">{source}</span>
                        </div>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{timeAgo}</span>
                        </div>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-4 group-hover:text-primary transition-colors">
                        {title}
                    </h2>

                    <p className="text-muted-foreground mb-6 line-clamp-3">
                        {summary}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto">
                        {tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="font-normal">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            </div>
        </Link>
    )
}
