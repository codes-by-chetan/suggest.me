import api from "./api.service";
import { friendsResponse, UserProfileResponse } from "../interfaces/user.interface";
import { response } from "@/interfaces/auth.interfaces";
export default class UserService {
  getAccessToken() {
    const token: string | null = localStorage.getItem("token");
    return token;
  }

  async getUserProfile(): Promise<UserProfileResponse> {
    return api
      .get("user/profile", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async getUserProfileById(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`profiles/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async followUser(userId: string): Promise<response> {
    return api
      .get(`relations/follow/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async unFollowUser(userId: string): Promise<response> {
    return api
      .get(`relations/unfollow/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async acceptFollowRequest(requestId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/accept/follow/${requestId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getRelation(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/relation/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async getFollowsYou(userId: string): Promise<UserProfileResponse> {
    return api
      .get(`relations/follows/you/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getUserWholeProfile(): Promise<response> {
    return api
      .get("user/profile-whole", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async getUserFriends(): Promise<friendsResponse> {
    return api
      .get("relations/friends", {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
  async updateUserProfilePicture(data: any): Promise<response> {
    return api
      .post("user/avatar", data, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }

  async updateUserProfile(data: any): Promise<response> {
    return api
      .post("user/update/profile", data, {
        headers: {
          Authorization: `Bearer ${this.getAccessToken()}`,
        },
      })
      .then((response: any) => {
        return response.data;
      })
      .catch((err) => {
        console.log(err);
        return err.response.data;
      });
  }
}
