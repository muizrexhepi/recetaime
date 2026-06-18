import { Redirect } from "expo-router";

export default function ImportImageRoute() {
  return <Redirect href="/import-recipe?mode=photo" />;
}
