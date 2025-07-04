import api from "./api.service";
import { getAccessToken } from "./notification.service";

interface SuggestContentParams {
  content: { [key: string]: any };
  note: string;
  recepients: { [key: string]: any }[];
  [key: string]: any;
}

interface PaginationParams {
  page?: number;
  limit?: number;
  type?: string;
}

export const suggestContent = async (data: SuggestContentParams) => {
  try {
    const response = await api.post("suggestions/suggest", data, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    });
    return response.data; // Extract the data field from ApiResponse
  } catch (err: any) {
    console.error("Error suggesting content:", err);
    throw new Error(
      err.response?.data?.message || "Abe, suggestion add nahi hua!"
    );
  }
};

export const getSuggestionDetails = async (id: string) => {
  return api
    .get(`suggestions/suggestion/details/${id}`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    })
    .then((response: any) => {
      return response.data;
    })
    .catch((err) => {
      console.log(err);
      return err.response.data;
    });
};

export const getSuggestedByYou = async ({
  page = 1,
  limit = 12,
  type,
}: PaginationParams = {}) => {
  try {
    const response = await api.get(`suggestions/suggested/by/you`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      params: { page, limit, type },
    });
    return response.data.data; // Extract the data field from ApiResponse
  } catch (err: any) {
    console.error("Error fetching suggestions sent by you:", err);
    throw new Error(
      err.response?.data?.message || "Abe, suggestions fetch nahi hui!"
    );
  }
};

export const getSuggestedToYou = async ({
  page = 1,
  limit = 12,
  type,
}: PaginationParams = {}) => {
  try {
    const response = await api.get(`suggestions/suggested/to/you`, {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
      params: { page, limit, type },
    });
    return response.data.data; // Extract the data field from ApiResponse
  } catch (err: any) {
    console.error("Error fetching suggestions for you:", err);
    throw new Error(
      err.response?.data?.message || "Abe, suggestions fetch nahi hui!"
    );
  }
};

const suggestionService = {
  suggestContent,
  getSuggestionDetails,
  getSuggestedByYou,
  getSuggestedToYou,
};

export default suggestionService;
