// Types partagés entre le panier client et le dashboard cuisine

export type CartItem = {
  id: string
  name: string
  price: number
  quantity: number
}

export type Commande = {
  id: number
  created_at: string
  mesa: number
  items: CartItem[]
  total: number
  estado: 'nuevo' | 'preparando' | 'listo'
}
