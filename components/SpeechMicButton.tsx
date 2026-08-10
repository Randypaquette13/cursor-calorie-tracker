import { isSpeechRecognitionAvailable } from '@/utils/speechRecognitionAvailable';

interface SpeechMicButtonProps {
  disabled?: boolean;
  text: string;
  onChangeText: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

/**
 * Hides itself in Expo Go (no native speech module).
 * In an EAS development/production build the mic is shown and speech works.
 * Lazy-require keeps expo-speech-recognition out of the Expo Go eval path.
 */
export function SpeechMicButton(props: SpeechMicButtonProps) {
  if (!isSpeechRecognitionAvailable()) {
    return null;
  }

  const { SpeechMicButtonImpl } =
    require('./SpeechMicButtonImpl') as typeof import('./SpeechMicButtonImpl');
  return <SpeechMicButtonImpl {...props} />;
}
