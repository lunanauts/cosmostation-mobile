import React, { ReactElement, useRef, useState } from 'react'
import {
  Image,
  View,
  TouchableOpacity,
  LogBox,
  StyleSheet,
} from 'react-native'
import Swiper from 'react-native-swiper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

import { COLOR } from 'consts'

import { setSkipOnboarding } from '../utils/storage'

import { Text } from 'components'
import images from 'assets/images'

LogBox.ignoreLogs([
  // https://reactjs.org/blog/2020/02/26/react-v16.13.0.html#warnings-for-some-updates-during-render
  'Warning: Cannot update a component from inside the function body of a different component.',
  //https://github.com/tannerlinsley/react-query/issues/1259
  'Setting a timer',
])

const PagerContents = [
  {
    image: images.on_boarding_0,
    title: 'Welcome Aboard',
    description:
      'Rebel Station is your gateway\nto the Terra ecosystem.',
  },
  {
    image: images.on_boarding_1,
    title: 'Manage Assets',
    description:
      'Transact, and stake assets\non the Terra blockchain.',
  },
  {
    image: images.on_boarding_2,
    title: 'Get Rewards',
    description:
      'Delegate LUNA and earn yield from\ntransactions on the Terra network.',
  },
  {
    image: images.on_boarding_4,
    title: 'Start Exploring',
    description: '',
  },
]

interface RenderSwiperProps {
  refSwipe: React.RefObject<Swiper>
  setLastPage: (b: boolean) => void
}

const RenderSwiper = ({
  refSwipe,
  setLastPage,
}: RenderSwiperProps): ReactElement => (
  <Swiper
    ref={refSwipe}
    onIndexChanged={(index): void =>
      setLastPage(index + 1 === PagerContents.length)
    }
    loop={false}
    dot={<View style={styles.SwiperDot} />}
    activeDot={<View style={styles.SwiperDotActive} />}
    containerStyle={{ marginBottom: '16%' }}
    paginationStyle={{ marginBottom: '-4%' }}
  >
    {PagerContents.map((v, i) => (
      <View key={i} style={styles.SwiperContent}>
        <View
          style={{
            height: '60%',
            paddingVertical: 20,
            alignContent: 'center',
            justifyContent: 'center',
          }}
        >
          <Image source={v.image} style={styles.SwiperContentImage} />
        </View>
        <View
          style={{
            minHeight: 160,
            paddingTop: 20,
          }}
        >
          <Text style={styles.SwiperContentTitle} fontType="bold">
            {v.title}
          </Text>
          <Text
            style={styles.SwiperContentDesc}
            adjustsFontSizeToFit
            numberOfLines={2}
          >
            {v.description}
          </Text>
        </View>
      </View>
    ))}
  </Swiper>
)

const RenderButton = ({
  refSwipe,
  closeOnBoarding,
  isLastPage,
}: {
  refSwipe: React.RefObject<Swiper>
  closeOnBoarding: () => void
  isLastPage: boolean
}): ReactElement => {
  const enterTabs = (): void => {
    setSkipOnboarding(true)
    closeOnBoarding()
  }

  return (
    <View style={styles.SwiperButtonContainer}>
      {!isLastPage ? (
        <>
          <TouchableOpacity
            style={styles.SwiperButtonSkip}
            onPress={enterTabs}
          >
            <Text
              style={styles.SwiperButtonSkipText}
              fontType={'medium'}
            >
              Skip
            </Text>
          </TouchableOpacity>
          <View style={{ width: 15 }} />
          <TouchableOpacity
            style={styles.SwiperButtonNext}
            onPress={(): void => refSwipe.current?.scrollBy(1)}
          >
            <Icon
              name="arrow-right"
              size={20}
              color="rgb(255,255,255)"
            />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TouchableOpacity
            style={styles.SwiperButtonStart}
            onPress={enterTabs}
          >
            <Text
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: 'rgb(255,255,255)',
              }}
              fontType={'medium'}
            >
              Get started
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const OnBoarding = ({
  closeOnBoarding,
}: {
  closeOnBoarding: () => void
}): ReactElement => {
  const [lastPage, setLastPage] = useState(false)
  const refSwipe = useRef<Swiper>(null)

  return (
    <>
      <RenderSwiper refSwipe={refSwipe} setLastPage={setLastPage} />
      <RenderButton
        refSwipe={refSwipe}
        closeOnBoarding={closeOnBoarding}
        isLastPage={lastPage}
      />
    </>
  )
}

const styles = StyleSheet.create({
  SwiperDot: {
    backgroundColor: 'rgba(32, 67, 181, 0.2)',
    width: 6,
    height: 6,
    borderRadius: 3,
    margin: 7,
  },
  SwiperDotActive: {
    backgroundColor: COLOR.primary._02,
    width: 10,
    height: 10,
    borderRadius: 5,
    margin: 7,
  },

  SwiperContent: {
    flex: 1,
    flexDirection: 'column',
    alignContent: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  SwiperContentImage: {
    resizeMode: 'contain',
    alignSelf: 'center',
    flex: 1,
    maxWidth: '100%',
  },
  SwiperContentTitle: {
    fontSize: 20,
    lineHeight: 36,
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 5,
  },
  SwiperContentDesc: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
  },
  SwiperButtonContainer: {
    marginBottom: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  SwiperButtonSkip: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingVertical: 13,
    backgroundColor: 'rgba(32, 67, 181, 0.2)',
    alignItems: 'center',
  },
  SwiperButtonSkipText: {
    color: COLOR.primary._02,
    fontSize: 16,
    lineHeight: 24,
  },
  SwiperButtonNext: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingVertical: 15,
    backgroundColor: COLOR.primary._02,
    alignItems: 'center',
  },
  SwiperButtonStart: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 58,
    paddingVertical: 13,
    backgroundColor: COLOR.primary._02,
    alignItems: 'center',
  },
})

export default OnBoarding
