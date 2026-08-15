import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField({ label, error, rightElement, style, ...props }, ref) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 6 }}>
      {label && <Text style={[styles.label, { color: colors.gray700 }]}>{label}</Text>}
      <View style={styles.row}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.gray500}
          style={[
            styles.input,
            {
              backgroundColor: colors.gray100,
              borderColor: error ? colors.rose400 : colors.gray200,
              color: colors.gray900,
            },
            rightElement ? { paddingRight: 44 } : null,
            style,
          ]}
          {...props}
        />
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      {error && <Text style={[styles.error, { color: colors.rose400 }]}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  row: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  rightElement: {
    position: 'absolute',
    right: 12,
  },
  error: {
    fontSize: 12,
    fontWeight: '600',
  },
});
