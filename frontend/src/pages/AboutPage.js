import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpenIcon,
  CodeBracketIcon,
  UserGroupIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-lg">
        <Icon className="w-6 h-6 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    </div>
    <p className="text-gray-600">{description}</p>
  </div>
);

const AboutPage = () => {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpenIcon,
      title: t('about.features.docSearch.title'),
      description: t('about.features.docSearch.description')
    },
    {
      icon: CodeBracketIcon,
      title: t('about.features.githubIntegration.title'),
      description: t('about.features.githubIntegration.description')
    },
    {
      icon: LightBulbIcon,
      title: t('about.features.aiAnswers.title'),
      description: t('about.features.aiAnswers.description')
    },
    {
      icon: UserGroupIcon,
      title: t('about.features.communityKnowledge.title'),
      description: t('about.features.communityKnowledge.description')
    },
    {
      icon: ShieldCheckIcon,
      title: t('about.features.sourceAttribution.title'),
      description: t('about.features.sourceAttribution.description')
    },
    {
      icon: RocketLaunchIcon,
      title: t('about.features.fastReliable.title'),
      description: t('about.features.fastReliable.description')
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
          {t('about.title')}
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          {t('about.subtitle')}
        </p>
      </div>

      {/* What is this section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('about.whatIs.title')}</h2>
        <div className="prose prose-lg max-w-none text-gray-600">
          <p>
            {t('about.whatIs.description1')}
          </p>
          <p>
            {t('about.whatIs.description2')}
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('about.features.title')}</h2>
          <p className="text-lg text-gray-600">
            {t('about.features.subtitle')}
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('about.howItWorks.title')}</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4">
              <span className="text-xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.howItWorks.step1.title')}</h3>
            <p className="text-gray-600">
              {t('about.howItWorks.step1.description')}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4">
              <span className="text-xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.howItWorks.step2.title')}</h3>
            <p className="text-gray-600">
              {t('about.howItWorks.step2.description')}
            </p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mx-auto mb-4">
              <span className="text-xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.howItWorks.step3.title')}</h3>
            <p className="text-gray-600">
              {t('about.howItWorks.step3.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Data Sources */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('about.dataSources.title')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="text-center">
            <BookOpenIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.dataSources.officialDocs.title')}</h3>
            <p className="text-gray-600">
              {t('about.dataSources.officialDocs.description')}
            </p>
          </div>

          <div className="text-center">
            <UserGroupIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.dataSources.githubIssues.title')}</h3>
            <p className="text-gray-600">
              {t('about.dataSources.githubIssues.description')}
            </p>
          </div>

          <div className="text-center">
            <CodeBracketIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('about.dataSources.sourceCode.title')}</h3>
            <p className="text-gray-600">
              {t('about.dataSources.sourceCode.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-gray-50 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{t('about.learnMore.title')}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <a
            href="https://inference.readthedocs.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{t('about.learnMore.documentation.title')}</h3>
            <p className="text-sm text-gray-600">{t('about.learnMore.documentation.description')}</p>
          </a>

          <a
            href="https://github.com/xorbitsai/inference"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{t('about.learnMore.github.title')}</h3>
            <p className="text-sm text-gray-600">{t('about.learnMore.github.description')}</p>
          </a>

          <a
            href="https://github.com/xorbitsai/inference/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{t('about.learnMore.issues.title')}</h3>
            <p className="text-sm text-gray-600">{t('about.learnMore.issues.description')}</p>
          </a>

          <a
            href="https://discord.gg/Xw9tszSkr5"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all"
          >
            <h3 className="font-semibold text-gray-900 mb-2">{t('about.learnMore.discord.title')}</h3>
            <p className="text-sm text-gray-600">{t('about.learnMore.discord.description')}</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
