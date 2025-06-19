import { Redirect } from "expo-router";

const SERVER_ADDRESS = "http://10.0.2.2:8000";

export { SERVER_ADDRESS };

export default function Index() {
  return <Redirect href="/login" />;
}
