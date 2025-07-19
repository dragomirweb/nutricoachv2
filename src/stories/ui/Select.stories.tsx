import type { Meta, StoryObj } from "@storybook/nextjs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Select",
  component: Select,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="meal-type">Meal Type</Label>
      <Select>
        <SelectTrigger id="meal-type">
          <SelectValue placeholder="Select meal type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="breakfast">Breakfast</SelectItem>
          <SelectItem value="lunch">Lunch</SelectItem>
          <SelectItem value="dinner">Dinner</SelectItem>
          <SelectItem value="snack">Snack</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Select a food category" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Proteins</SelectLabel>
          <SelectItem value="chicken">Chicken Breast</SelectItem>
          <SelectItem value="salmon">Salmon</SelectItem>
          <SelectItem value="eggs">Eggs</SelectItem>
          <SelectItem value="tofu">Tofu</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Carbohydrates</SelectLabel>
          <SelectItem value="rice">Brown Rice</SelectItem>
          <SelectItem value="oats">Oatmeal</SelectItem>
          <SelectItem value="quinoa">Quinoa</SelectItem>
          <SelectItem value="sweet-potato">Sweet Potato</SelectItem>
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>Fats</SelectLabel>
          <SelectItem value="avocado">Avocado</SelectItem>
          <SelectItem value="nuts">Mixed Nuts</SelectItem>
          <SelectItem value="olive-oil">Olive Oil</SelectItem>
          <SelectItem value="nut-butter">Almond Butter</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const GoalSelector: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="goal">Nutrition Goal</Label>
      <Select>
        <SelectTrigger id="goal">
          <SelectValue placeholder="Select your goal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="lose-weight">Lose Weight</SelectItem>
          <SelectItem value="maintain">Maintain Weight</SelectItem>
          <SelectItem value="gain-muscle">Gain Muscle</SelectItem>
          <SelectItem value="improve-health">Improve Overall Health</SelectItem>
          <SelectItem value="athletic">Athletic Performance</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const ActivityLevel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="activity">Activity Level</Label>
      <Select>
        <SelectTrigger id="activity">
          <SelectValue placeholder="Select activity level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sedentary">
            <div>
              <div className="font-medium">Sedentary</div>
              <div className="text-sm text-muted-foreground">
                Little to no exercise
              </div>
            </div>
          </SelectItem>
          <SelectItem value="light">
            <div>
              <div className="font-medium">Lightly Active</div>
              <div className="text-sm text-muted-foreground">
                Exercise 1-3 days/week
              </div>
            </div>
          </SelectItem>
          <SelectItem value="moderate">
            <div>
              <div className="font-medium">Moderately Active</div>
              <div className="text-sm text-muted-foreground">
                Exercise 3-5 days/week
              </div>
            </div>
          </SelectItem>
          <SelectItem value="very">
            <div>
              <div className="font-medium">Very Active</div>
              <div className="text-sm text-muted-foreground">
                Exercise 6-7 days/week
              </div>
            </div>
          </SelectItem>
          <SelectItem value="extra">
            <div>
              <div className="font-medium">Extra Active</div>
              <div className="text-sm text-muted-foreground">
                Physical job or 2x/day training
              </div>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const PortionSize: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="portion">Portion Size</Label>
      <Select>
        <SelectTrigger id="portion">
          <SelectValue placeholder="Select portion size" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0.5">Half Serving</SelectItem>
          <SelectItem value="1">1 Serving</SelectItem>
          <SelectItem value="1.5">1.5 Servings</SelectItem>
          <SelectItem value="2">2 Servings</SelectItem>
          <SelectItem value="3">3 Servings</SelectItem>
          <SelectItem value="custom">Custom Amount</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Select disabled>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Disabled" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
      </SelectContent>
    </Select>
  ),
};
