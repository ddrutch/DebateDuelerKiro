// src/components/MainScreen.tsx
import { Devvit } from '@devvit/public-api';
import { HeroButton } from './HeroButton'; // Assuming HeroButton is in the same 'components' directory

interface MainScreenProps {
  onPlayPress: () => void;
  onBoltPress: () => void;
}

export const MainScreen: Devvit.BlockComponent<MainScreenProps> = ({ onPlayPress, onBoltPress }) => {
  return (
    <zstack width="100%" height="100%" alignment="center middle">
      {/* Background */}
      <image
        imageHeight={1024}
        imageWidth={1500}
        height="100%"
        width="100%"
        url="background2.png"
        description="Striped blue background"
        resizeMode="cover"
      />

      {/* Bolt badge in top‑right, smaller */}
      <zstack
        width="100%"
        height="100%"
        alignment="top center"
        padding="small"
      >
        <image
          url="bolt.png"
          description="Bolt badge"
          width="50px"
          height="50px"
          imageWidth="150px"
          imageHeight="150px"
          onPress={onBoltPress} // Use prop for onPress
        />
      </zstack>

      <vstack alignment="center" gap="none" padding="large" grow>
        {/* Logo */}
        <vstack width="100%" height="30%" alignment="top center">
          <image
            url="logo.png"
            description="Logo"
            height="140px"
            width="140px"
            imageHeight="240px"
            imageWidth="240px"
          />
        </vstack>

        {/* Title / subtitle */}
        <vstack height="30%" alignment="middle center" gap="medium">
          <text size="xxlarge" weight="bold" outline="thick">
            Debate Dueler
          </text>
        </vstack>

        {/* HeroButton */}
        <vstack height="40%" alignment="bottom center" gap="medium">
          <HeroButton
            label="Play the game!!"
            onPress={onPlayPress} // Use prop for onPress
            animated
          />
        </vstack>
      </vstack>
    </zstack>
  );
};