import { useCallback } from 'react';
import { useProfileStore } from '../../../store/profileStore';
import type { UpdateProfileRequest } from '../../../types/profile';

export function useProfile() {
  const { profile, isLoading, isUpdating, error, fetchProfile, updateProfile, setProfile } =
    useProfileStore();

  const handleUpdateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      return updateProfile(data);
    },
    [updateProfile],
  );

  return {
    profile,
    isLoading,
    isUpdating,
    error,
    fetchProfile,
    updateProfile: handleUpdateProfile,
    setProfile,
  };
}
