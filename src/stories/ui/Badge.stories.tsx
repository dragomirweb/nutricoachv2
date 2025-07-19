import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from '@/components/ui/badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge>Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
}

export const MealTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-orange-500 hover:bg-orange-600">Breakfast</Badge>
      <Badge className="bg-blue-500 hover:bg-blue-600">Lunch</Badge>
      <Badge className="bg-purple-500 hover:bg-purple-600">Dinner</Badge>
      <Badge className="bg-green-500 hover:bg-green-600">Snack</Badge>
    </div>
  ),
}

export const NutritionLabels: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline" className="border-protein text-protein">
        High Protein
      </Badge>
      <Badge variant="outline" className="border-carbs text-carbs">
        Low Carb
      </Badge>
      <Badge variant="outline" className="border-fat text-fat">
        Healthy Fats
      </Badge>
      <Badge variant="outline" className="border-fiber text-fiber">
        High Fiber
      </Badge>
      <Badge variant="secondary">Vegetarian</Badge>
      <Badge variant="secondary">Gluten Free</Badge>
      <Badge variant="secondary">Keto</Badge>
    </div>
  ),
}

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
        Goal Met
      </Badge>
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
        In Progress
      </Badge>
      <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
        Over Limit
      </Badge>
      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
        Tracking
      </Badge>
    </div>
  ),
}

export const WithCounts: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="secondary">
        Calories <span className="ml-1 font-bold">1234</span>
      </Badge>
      <Badge variant="secondary">
        Protein <span className="ml-1 font-bold">89g</span>
      </Badge>
      <Badge variant="secondary">
        Carbs <span className="ml-1 font-bold">234g</span>
      </Badge>
      <Badge variant="secondary">
        Fat <span className="ml-1 font-bold">56g</span>
      </Badge>
    </div>
  ),
}