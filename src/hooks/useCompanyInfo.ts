import { useQuery } from '@tanstack/react-query';
import { getCompanyInfo } from '../lib/api';
import { useTranslation } from '../context/TranslationContext';

export function useCompanyInfo() {
  const { language } = useTranslation();
  
  const query = useQuery({
    queryKey: ['companyInfo'],
    queryFn: getCompanyInfo
  });

  return {
    ...query,
    aboutUs: language === 'en' ? query.data?.about_us_en : query.data?.about_us_fr
  };
}