import type { RestaurantMenu } from "@/types";

export const demoMenu: RestaurantMenu = {
  restaurant: {
    id: "moai-kitchen",
    name: "Moai Kitchen",
    slug: "moai-kitchen",
    logoUrl:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    isOpen: true,
    isActive: true,
  },

  categories: [
    {
      id: "cat-1",
      name: "Starters",
      sortOrder: 1,
      isActive: true,
    },
    {
      id: "cat-2",
      name: "Main Course",
      sortOrder: 2,
      isActive: true,
    },
    {
      id: "cat-3",
      name: "Desserts",
      sortOrder: 3,
      isActive: true,
    },
    {
      id: "cat-4",
      name: "Drinks",
      sortOrder: 4,
      isActive: true,
    },
  ],

  dishes: [
    {
      id: "dish-1",
      categoryId: "cat-1",
      name: "Crispy Chicken",
      description:
        "Tender chicken breast strips coated in spiced panko crumbs, fried golden and served with smoky house garlic aioli.",
      price: 249,
      imageUrl:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-1.mp4",
      videoPosterUrl:
        "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80",
      isVeg: false,
      isAvailable: true,
      sortOrder: 1,
      addonGroups: [
        {
          id: "addon-group-1",
          name: "Choose Dip",
          isRequired: true,
          minSelect: 1,
          maxSelect: 1,
          addons: [
            {
              id: "ad-1",
              name: "Smoky Garlic Aioli",
              price: 0,
              isAvailable: true,
            },
            {
              id: "ad-2",
              name: "Spicy Sriracha Mayo",
              price: 20,
              isAvailable: true,
            },
            {
              id: "ad-3",
              name: "Truffle Herb Dip",
              price: 40,
              isAvailable: true,
            },
          ],
        },
        {
          id: "addon-group-2",
          name: "Extras",
          isRequired: false,
          minSelect: 0,
          maxSelect: 2,
          addons: [
            {
              id: "ad-4",
              name: "Extra Melted Cheddar",
              price: 50,
              isAvailable: true,
            },
            {
              id: "ad-5",
              name: "Crispy Bacon Crumbles",
              price: 60,
              isAvailable: true,
            },
          ],
        },
      ],
    },
    {
      id: "dish-2",
      categoryId: "cat-1",
      name: "Paneer Tikka",
      description:
        "Chargrilled cottage cheese marinated in hung curd, Kashmiri chilli, roasted gram flour, and bell peppers.",
      price: 229,
      imageUrl:
        "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-2.mp4",
      videoPosterUrl: "",
      isVeg: true,
      isAvailable: true,
      sortOrder: 2,
      addonGroups: [
        {
          id: "addon-group-3",
          name: "Accompaniments",
          isRequired: false,
          minSelect: 0,
          maxSelect: 2,
          addons: [
            {
              id: "ad-6",
              name: "Mint Chutney & Pickled Onions",
              price: 0,
              isAvailable: true,
            },
            {
              id: "ad-7",
              name: "Butter Garlic Naan",
              price: 55,
              isAvailable: true,
            },
          ],
        },
      ],
    },
    {
      id: "dish-3",
      categoryId: "cat-2",
      name: "Signature Burger",
      description:
        "Double-stacked artisan patty, caramelized onions, aged cheddar, crisp romaine, and secret sauce on a toasted brioche bun.",
      price: 299,
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-1.mp4",
      videoPosterUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      isVeg: false,
      isAvailable: true,
      sortOrder: 1,
      addonGroups: [
        {
          id: "addon-group-4",
          name: "Add Cheese & Patties",
          isRequired: false,
          minSelect: 0,
          maxSelect: 2,
          addons: [
            {
              id: "ad-8",
              name: "Double Smoked Cheese",
              price: 45,
              isAvailable: true,
            },
            {
              id: "ad-9",
              name: "Extra Grilled Patty",
              price: 110,
              isAvailable: true,
            },
          ],
        },
        {
          id: "addon-group-5",
          name: "Side Choices",
          isRequired: false,
          minSelect: 0,
          maxSelect: 1,
          addons: [
            {
              id: "ad-10",
              name: "Peri-Peri Seasoned Fries",
              price: 69,
              isAvailable: true,
            },
            {
              id: "ad-11",
              name: "Cheesy Onion Rings",
              price: 79,
              isAvailable: true,
            },
          ],
        },
      ],
    },
    {
      id: "dish-4",
      categoryId: "cat-3",
      name: "Chocolate Brownie",
      description:
        "Warm fudgy Belgian chocolate brownie drizzled with hot dark ganache, paired with a scoop of Madagascar vanilla bean gelato.",
      price: 179,
      imageUrl:
        "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-2.mp4",
      videoPosterUrl: "",
      isVeg: true,
      isAvailable: true,
      sortOrder: 1,
      addonGroups: [
        {
          id: "addon-group-6",
          name: "Toppings",
          isRequired: false,
          minSelect: 0,
          maxSelect: 2,
          addons: [
            {
              id: "ad-12",
              name: "Extra Vanilla Gelato Scoop",
              price: 49,
              isAvailable: true,
            },
            {
              id: "ad-13",
              name: "Roasted Hazelnuts & Almonds",
              price: 35,
              isAvailable: true,
            },
          ],
        },
      ],
    },
    {
      id: "dish-5",
      categoryId: "cat-4",
      name: "Fresh Mint Mojito",
      description:
        "Zesty fresh muddled lime wedges, crushed garden mint leaves, cane sugar, and sparkling soda over crushed ice.",
      price: 149,
      imageUrl:
        "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-1.mp4",
      videoPosterUrl: "",
      isVeg: true,
      isAvailable: true,
      sortOrder: 1,
    },
    {
      id: "dish-6",
      categoryId: "cat-4",
      name: "Cold Brew Coffee",
      description:
        "18-hour slow-steeped Arabica single-origin cold brew poured over clear ice blocks with a velvety smooth finish.",
      price: 169,
      imageUrl:
        "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80",
      videoUrl: "/videos/demo-video-2.mp4",
      videoPosterUrl: "",
      isVeg: true,
      isAvailable: true,
      sortOrder: 2,
    },
  ],
};
