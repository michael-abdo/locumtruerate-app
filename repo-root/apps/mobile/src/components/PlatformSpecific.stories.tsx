/**
 * PlatformSpecific Components Storybook Stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { View, Text } from 'react-native'
import {
  PlatformButton,
  PlatformCard,
  PlatformHeader,
  PlatformListItem,
} from './PlatformSpecific'

// PlatformButton stories
const buttonMeta: Meta<typeof PlatformButton> = {
  title: 'Platform/PlatformButton',
  component: PlatformButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Platform-optimized button with haptic feedback and native styling for iOS and Android.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive'],
      description: 'Button style variant',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    onPress: {
      action: 'pressed',
      description: 'Callback fired when button is pressed',
    },
  },
}

export default buttonMeta
type ButtonStory = StoryObj<typeof PlatformButton>

export const Primary: ButtonStory = {
  args: {
    title: 'Primary Button',
    variant: 'primary',
    size: 'medium',
    onPress: action('primary-pressed'),
  },
}

export const Secondary: ButtonStory = {
  args: {
    title: 'Secondary Button',
    variant: 'secondary',
    size: 'medium',
    onPress: action('secondary-pressed'),
  },
}

export const Destructive: ButtonStory = {
  args: {
    title: 'Delete',
    variant: 'destructive',
    size: 'medium',
    onPress: action('destructive-pressed'),
  },
}

export const Small: ButtonStory = {
  args: {
    title: 'Small',
    size: 'small',
    onPress: action('small-pressed'),
  },
}

export const Large: ButtonStory = {
  args: {
    title: 'Large Button',
    size: 'large',
    onPress: action('large-pressed'),
  },
}

export const Disabled: ButtonStory = {
  args: {
    title: 'Disabled',
    disabled: true,
    onPress: action('disabled-pressed'),
  },
}

// Button variations showcase
export const AllVariants: ButtonStory = {
  render: () => (
    <View style={{ gap: 16, padding: 20 }}>
      <PlatformButton title="Primary" variant="primary" onPress={action('primary')} />
      <PlatformButton title="Secondary" variant="secondary" onPress={action('secondary')} />
      <PlatformButton title="Destructive" variant="destructive" onPress={action('destructive')} />
      <PlatformButton title="Small" size="small" onPress={action('small')} />
      <PlatformButton title="Large" size="large" onPress={action('large')} />
      <PlatformButton title="Disabled" disabled onPress={action('disabled')} />
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all button variants and sizes.',
      },
    },
  },
}

// PlatformCard stories
const cardMeta: Meta<typeof PlatformCard> = {
  title: 'Platform/PlatformCard',
  component: PlatformCard,
  parameters: {
    layout: 'centered',
  },
}

export const BasicCard: StoryObj<typeof PlatformCard> = {
  render: (args) => (
    <PlatformCard {...args}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
        Card Title
      </Text>
      <Text style={{ fontSize: 14, color: '#64748b', lineHeight: 20 }}>
        This is a platform-optimized card component with appropriate shadows 
        and styling for both iOS and Android platforms.
      </Text>
    </PlatformCard>
  ),
  args: {
    elevated: true,
  },
}

export const FlatCard: StoryObj<typeof PlatformCard> = {
  render: (args) => (
    <PlatformCard {...args}>
      <Text style={{ fontSize: 16 }}>Flat card without elevation</Text>
    </PlatformCard>
  ),
  args: {
    elevated: false,
  },
}

export const CustomStyledCard: StoryObj<typeof PlatformCard> = {
  render: (args) => (
    <PlatformCard {...args}>
      <Text style={{ fontSize: 16, color: '#2563eb' }}>Custom styled card</Text>
    </PlatformCard>
  ),
  args: {
    style: {
      backgroundColor: '#f0f9ff',
      borderWidth: 1,
      borderColor: '#2563eb',
    },
  },
}

// PlatformHeader stories
const headerMeta: Meta<typeof PlatformHeader> = {
  title: 'Platform/PlatformHeader',
  component: PlatformHeader,
  parameters: {
    layout: 'fullscreen',
  },
}

export const BasicHeader: StoryObj<typeof PlatformHeader> = {
  args: {
    title: 'Screen Title',
  },
}

export const HeaderWithButtons: StoryObj<typeof PlatformHeader> = {
  args: {
    title: 'Edit Profile',
    leftButton: {
      title: 'Cancel',
      onPress: action('cancel-pressed'),
    },
    rightButton: {
      title: 'Save',
      onPress: action('save-pressed'),
    },
  },
}

export const BackHeader: StoryObj<typeof PlatformHeader> = {
  args: {
    title: 'Job Details',
    leftButton: {
      title: '← Back',
      onPress: action('back-pressed'),
    },
  },
}

// PlatformListItem stories
const listMeta: Meta<typeof PlatformListItem> = {
  title: 'Platform/PlatformListItem',
  component: PlatformListItem,
  parameters: {
    layout: 'centered',
  },
}

export const BasicListItem: StoryObj<typeof PlatformListItem> = {
  args: {
    title: 'Basic List Item',
  },
}

export const ListItemWithSubtitle: StoryObj<typeof PlatformListItem> = {
  args: {
    title: 'Emergency Medicine',
    subtitle: 'Austin, TX • $300k annually',
  },
}

export const ClickableListItem: StoryObj<typeof PlatformListItem> = {
  args: {
    title: 'Clickable Item',
    subtitle: 'Tap to navigate',
    onPress: action('list-item-pressed'),
  },
}

export const ListItemWithRightElement: StoryObj<typeof PlatformListItem> = {
  args: {
    title: 'Notifications',
    subtitle: 'Push notifications enabled',
    rightElement: <Text style={{ color: '#2563eb' }}>›</Text>,
    onPress: action('notifications-pressed'),
  },
}

export const ListItemWithSwitch: StoryObj<typeof PlatformListItem> = {
  render: (args) => (
    <PlatformListItem
      {...args}
      rightElement={
        <View style={{ 
          width: 40, 
          height: 20, 
          backgroundColor: '#2563eb', 
          borderRadius: 10,
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingHorizontal: 2,
        }}>
          <View style={{
            width: 16,
            height: 16,
            backgroundColor: '#ffffff',
            borderRadius: 8,
          }} />
        </View>
      }
    />
  ),
  args: {
    title: 'Biometric Login',
    subtitle: 'Use Face ID to sign in',
  },
}

// Complete list showcase
export const ListShowcase: StoryObj<typeof PlatformListItem> = {
  render: () => (
    <View style={{ width: 350 }}>
      <PlatformCard>
        <PlatformListItem
          title="Account Settings"
          subtitle="Manage your profile and preferences"
          rightElement={<Text style={{ color: '#64748b' }}>›</Text>}
          onPress={action('account-settings')}
        />
        <PlatformListItem
          title="Notifications"
          subtitle="Job alerts and updates"
          rightElement={<Text style={{ color: '#64748b' }}>›</Text>}
          onPress={action('notifications')}
        />
        <PlatformListItem
          title="Privacy & Security"
          subtitle="Biometric login, data protection"
          rightElement={<Text style={{ color: '#64748b' }}>›</Text>}
          onPress={action('privacy')}
        />
        <PlatformListItem
          title="Help & Support"
          rightElement={<Text style={{ color: '#64748b' }}>›</Text>}
          onPress={action('help')}
        />
      </PlatformCard>
    </View>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a settings screen using multiple list items in a card.',
      },
    },
  },
}