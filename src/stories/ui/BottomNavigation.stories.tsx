import type { Meta, StoryObj } from "@storybook/nextjs";
import { BottomNavigation } from "@/components/ui/bottom-navigation";

const meta = {
  title: "UI/BottomNavigation",
  component: BottomNavigation,
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/dashboard",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    showFab: {
      control: "boolean",
      description: "Whether to show the floating action button",
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-screen bg-background">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">Page Content</h1>
          <p className="text-muted-foreground">
            This is where your page content would go. The bottom navigation is
            fixed at the bottom of the screen.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showFab: true,
  },
};

export const NoFab: Story = {
  args: {
    showFab: false,
  },
};

export const DifferentRoutes: Story = {
  render: () => {
    const routes = ["/dashboard", "/meals", "/goals", "/profile"];

    return (
      <div className="space-y-4">
        <p className="p-4 text-sm text-muted-foreground">
          Click the links below to see different active states:
        </p>
        {routes.map((route) => (
          <div key={route} className="relative h-32 border rounded-lg">
            <p className="p-4 text-sm">Active route: {route}</p>
            <div className="relative">
              <BottomNavigation />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    layout: "padded",
  },
};
