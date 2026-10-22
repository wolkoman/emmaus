type RequestInitPlus = RequestInit & { jwt?: string; json?: any };
export const fetchJson = (input: RequestInfo, init: RequestInitPlus = {}) => {
  if ("JWT_EMMAUS" in init) {
    init = {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${init.jwt}` },
    };
  }
  if ("json" in init) {
    init = {
      ...init,
      method: "POST",
      body: JSON.stringify(init.json),
      headers: {
        ...init.headers,
        "Content-Type": `application/json;charset=UTF-8`,
      },
    };
    console.log(init);
  }
  return fetch(input, init).then((response) => {
    if (!response.ok) {
      throw new Error("Response not successful");
    } else return response.json();
  });
};
