package net.terrarebels.station.KeystoreLib;

@Deprecated
public interface StorageCipher {
    byte[] encrypt(byte[] input) throws Exception;

    byte[] decrypt(byte[] input) throws Exception;
}
