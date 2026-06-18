import { Redirect } from "expo-router";

export default function ImportTextRoute() {
  return <Redirect href="/import-recipe?mode=text" />;
}
