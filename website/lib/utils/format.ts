import { format, formatDistanceToNow } from 'date-fns'

export function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num)
}

export function formatPercent(num: number): string {
    return `${num.toFixed(0)}%`
}

export function formatDate(timestamp: number | string | null): string {
    if (!timestamp) return 'N/A'

    const date = typeof timestamp === 'number'
        ? new Date(timestamp * 1000)
        : new Date(timestamp)

    return format(date, 'MMM dd, yyyy')
}

export function formatRelativeDate(timestamp: number | string | null): string {
    if (!timestamp) return 'N/A'

    const date = typeof timestamp === 'number'
        ? new Date(timestamp * 1000)
        : new Date(timestamp)

    return formatDistanceToNow(date, { addSuffix: true })
}

export function getImageUrl(photo: any, size: 'thumb' | 'small' | 'med' | 'full' = 'med'): string {
    if (!photo || typeof photo !== 'object') return '/placeholder.png'
    return photo[size] || photo.full || '/placeholder.png'
}

export function getAvatarUrl(avatar: any, size: 'thumb' | 'small' | 'medium' = 'small'): string {
    if (!avatar || typeof avatar !== 'object') return '/placeholder-avatar.png'
    return avatar[size] || avatar.thumb || '/placeholder-avatar.png'
}

export function getCategoryName(category: any): string {
    if (!category || typeof category !== 'object') return 'Uncategorized'
    return category.name || 'Uncategorized'
}

export function getLocationName(location: any): string {
    if (!location || typeof location !== 'object') return 'Unknown'
    return location.displayable_name || location.name || 'Unknown'
}
