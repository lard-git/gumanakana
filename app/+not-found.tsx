import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import colors from "../constants/colors";

const c = colors.light;

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/login" style={styles.link}>
          <Text style={styles.linkText}>Go back to login</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20, backgroundColor: c.background },
  title: { fontSize: 20, fontWeight: "bold", color: c.gray900 },
  link: { marginTop: 15, paddingVertical: 15 },
  linkText: { fontSize: 14, color: c.primary },
});
