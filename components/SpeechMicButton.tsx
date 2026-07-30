import { isSpeechRecognitionAvailable } from '@/utils/speechRecognitionAvailable';

interface SpeechMicButtonProps {
  disabled?: boolean;
  text: string;
  onChangeText: (text: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

export function SpeechMicButton(props: SpeechMicButtonProps) {
  if (!isSpeechRecognitionAvailable()) {
    return null;
  }

  const { SpeechMicButtonImpl } = require('./SpeechMicButtonImpl') as typeof import('./SpeechMicButtonImpl');
  return <SpeechMicButtonImpl {...props} />;
}
