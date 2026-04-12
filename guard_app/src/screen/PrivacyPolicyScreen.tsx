import { Alert, Linking, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAppTheme } from '../theme';
import { AppColors } from '../theme/colors';

const CANVAS_PADDING = 20;

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const openMail = () =>
    Linking.openURL('mailto:support@secureshift.app?subject=SecureShift%20Guard%20Support').catch(
      () => Alert.alert('Unable to open mail app'),
    );

  const callSupport = () =>
    Linking.openURL('tel:+61123456789').catch(() => Alert.alert('Unable to start call'));

  const openWebsite = () =>
    Linking.openURL('https://example.gopherindustries.com/secure-shift').catch(() =>
      Alert.alert('Unable to open website'),
    );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll}>
        <View style={styles.view}>
          <Text style={styles.policyTitle}>Secure Shift Privacy Policy</Text>
          <Text style={styles.policyHead}>
            This Privacy Policy is a placeholder for the development version of Secure Shift Guard
            App.
          </Text>
          <Text style={styles.policyText}>
            Gopher Industries are committed to providing quality services to you and this policy
            outlines our ongoing obligations to you in respect of how we manage your Personal
            Information.
            {'\n'}We have adopted the Australian Privacy Principles (APPs) contained in the Privacy
            Act 1988 (Cth) (the Privacy Act). The NPPs govern the way in which we collect, use,
            disclose, store, secure and dispose of your Personal Information.
            {'\n'}A copy of the Australian Privacy Principles may be obtained from the website of
            The Office of the Australian Information Commissioner at{' '}
            <Text
              style={styles.policyLink}
              onPress={() => Linking.openURL('https://www.oaic.gov.au/')}
            >
              https://www.oaic.gov.au/
            </Text>
            .
          </Text>
          <Text style={styles.policyHead}>
            What is Personal Information and why do we collect it?
          </Text>
          <Text style={styles.policyText}>
            Personal Information is information or an opinion that identifies an individual.
            Examples of Personal Information we collect includes names, addresses, email addresses,
            phone and facsimile numbers.
            {'\n'}This Personal Information is obtained in many ways including correspondence, by
            telephone and facsimile, by email, via our website{' '}
            <Text style={styles.policyLink} onPress={openWebsite}>
              https://example.gopherindustries.com/secure-shift
            </Text>
            , from our app Secure Shift Guard App and cookies. We don&apos;t guarantee website links
            or policy of authorised third parties.
            {'\n'}We collect your Personal Information for the primary purpose of providing our
            services to you, providing information to our clients and marketing. We may also use
            your Personal Information for secondary purposes closely related to the primary purpose,
            in circumstances where you would reasonably expect such use or disclosure. You may
            unsubscribe from our mailing/marketing lists at any time by contacting us in writing.
            {'\n'}When we collect Personal Information we will, where appropriate and where
            possible, explain to you why we are collecting the information and how we plan to use
            it.
          </Text>
          <Text style={styles.policyHead}>Sensitive Information</Text>
          <Text style={styles.policyText}>
            Sensitive information is defined in the Privacy Act to include information or opinion
            about such things as an individual&apos;s racial or ethnic origin, political opinions,
            membership of a political association, religious or philosophical beliefs, membership of
            a trade union or other professional body, criminal record or health information.
            {'\n'}Sensitive information will be used by us only:
            {'\n'}• For the primary purpose for which it was obtained
            {'\n'}• For a secondary purpose that is directly related to the primary purpose
            {'\n'}• With your consent; or where required or authorised by law.
          </Text>
          <Text style={styles.policyHead}>Third Parties</Text>
          <Text style={styles.policyText}>
            Where reasonable and practicable to do so, we will collect your Personal Information
            only from you. However, in some circumstances we may be provided with information by
            third parties. In such a case we will take reasonable steps to ensure that you are made
            aware of the information provided to us by the third party.
          </Text>
          <Text style={styles.policyHead}>Disclosure of Personal Information</Text>
          <Text style={styles.policyText}>
            Your Personal Information may be disclosed in a number of circumstances including the
            following:
            {'\n'}• Third parties where you consent to the use or disclosure; and
            {'\n'}• Where required or authorised by law.
          </Text>
          <Text style={styles.policyHead}>Security of Personal Information</Text>
          <Text style={styles.policyText}>
            Your Personal Information is stored in a manner that reasonably protects it from misuse
            and loss and from unauthorized access, modification or disclosure.
            {'\n'}When your Personal Information is no longer needed for the purpose for which it
            was obtained, we will take reasonable steps to destroy or permanently de-identify your
            Personal Information. However, most of the Personal Information is or will be stored in
            client files which will be kept by us for a minimum of 7 years.
          </Text>
          <Text style={styles.policyHead}>Access to your Personal Information</Text>
          <Text style={styles.policyText}>
            You may access the Personal Information we hold about you and to update and/or correct
            it, subject to certain exceptions. If you wish to access your Personal Information,
            please contact us in writing.
            {'\n'}Gopher Industries will not charge any fee for your access request, but may charge
            an administrative fee for providing a copy of your Personal Information.
            {'\n'}In order to protect your Personal Information we may require identification from
            you before releasing the requested information.
          </Text>
          <Text style={styles.policyHead}>
            Maintaining the Quality of your Personal Information
          </Text>
          <Text style={styles.policyText}>
            It is an important to us that your Personal Information is up to date. We will take
            reasonable steps to make sure that your Personal Information is accurate, complete and
            up-to-date. If you find that the information we have is not up to date or is inaccurate,
            please advise us as soon as practicable so we can update our records and ensure we can
            continue to provide quality services to you.
          </Text>
          <Text style={styles.policyHead}>Policy Updates</Text>
          <Text style={styles.policyText}>
            This Policy may change from time to time and is available on our website or app. This
            Policy is a placeholder for the development of Secure Shift Guard App.
          </Text>
          <Text style={styles.policyHead}>Privacy Policy Complaints and Enquiries</Text>
          <Text style={styles.policyText}>
            If you have any queries or complaints about our Privacy Polcy please contact us at:
            {'\n'}Email:{' '}
            <Text style={styles.policyLink} onPress={openMail}>
              support@secureshift.app
            </Text>
            {'\n'}Phone:{' '}
            <Text style={styles.policyLink} onPress={callSupport}>
              +61123456789
            </Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: AppColors) =>
  StyleSheet.create({
    policyTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    policyHead: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '800',
      marginTop: 10,
      marginBottom: 6,
    },
    policyText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    policyLink: {
      color: colors.link,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 20,
    },
    safe: { backgroundColor: colors.bg, flex: 1 },
    scroll: { padding: CANVAS_PADDING },
    view: { marginBottom: CANVAS_PADDING + 50 },
  });
